import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/sales-flow - Get quotes, orders, and sales
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const companyId = session.user.companyId
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') // QUOTE, ORDER, SALE, or all
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: any = { companyId }
        if (type) {
            where.documentType = type
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: true,
                items: {
                    include: { product: true }
                },
                user: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json({
            success: true,
            sales
        })
    } catch (error) {
        console.error('Error fetching sales:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener documentos' },
            { status: 500 }
        )
    }
}

// POST /api/sales-flow - Create new quote/order/sale
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const companyId = session.user.companyId
        const userId = session.user.id
        const body = await req.json()

        const {
            documentType = 'SALE',
            customerId,
            items,
            paymentMethod,
            paymentReference,
            creditDays,
            bcvRate,
            subtotalUSD,
            taxAmountUSD,
            totalUSD,
            subtotalBS,
            taxAmountBS,
            totalBS,
            notes
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Debe agregar al menos un producto' },
                { status: 400 }
            )
        }

        // Generate sale number
        const lastSale = await prisma.sale.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            select: { saleNumber: true }
        })

        let nextNumber = 1
        if (lastSale?.saleNumber) {
            const match = lastSale.saleNumber.match(/(\d+)$/)
            if (match) {
                nextNumber = parseInt(match[1]) + 1
            }
        }

        const prefix = documentType === 'QUOTE' ? 'COT' : documentType === 'ORDER' ? 'PED' : 'VEN'
        const saleNumber = `${prefix}-${nextNumber.toString().padStart(5, '0')}`

        // Calculate due date for credit sales
        let dueDate = null
        if (paymentMethod === 'CREDIT_SALE' && creditDays) {
            dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + creditDays)
        }

        // Determine status based on document type and payment
        let status = 'DRAFT'
        let paymentStatus = 'PENDING'
        const now = new Date()

        if (documentType === 'QUOTE') {
            status = 'ACTIVE'
        } else if (documentType === 'ORDER') {
            status = 'ACTIVE'
        } else if (documentType === 'SALE') {
            if (paymentMethod === 'CREDIT_SALE') {
                status = 'COMPLETED'
                paymentStatus = 'CREDIT'
            } else {
                status = 'COMPLETED'
                paymentStatus = 'PAID'
            }
        }

        // Create the sale
        const sale = await prisma.sale.create({
            data: {
                companyId,
                userId,
                customerId: customerId || null,
                saleNumber,
                invoiceNumber: documentType === 'SALE' ? saleNumber : null,
                invoiceDate: documentType === 'SALE' ? now : null,
                documentType,
                quotedAt: documentType === 'QUOTE' ? now : null,
                orderedAt: documentType === 'ORDER' ? now : documentType === 'SALE' ? now : null,
                paidAt: documentType === 'SALE' && paymentMethod !== 'CREDIT_SALE' ? now : null,
                creditDays: paymentMethod === 'CREDIT_SALE' ? creditDays : null,
                dueDate,
                subtotalUSD,
                subtotalBS,
                taxAmountUSD,
                taxAmountBS,
                taxRate: 16,
                totalUSD,
                totalBS,
                bcvRate,
                status,
                paymentStatus,
                notes,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        description: item.description || '',
                        quantity: item.quantity,
                        unitPriceUSD: item.unitPriceUSD,
                        unitPriceBS: item.unitPriceUSD * bcvRate,
                        subtotalUSD: item.unitPriceUSD * item.quantity,
                        subtotalBS: item.unitPriceUSD * item.quantity * bcvRate,
                        taxAmountUSD: item.unitPriceUSD * item.quantity * 0.16,
                        taxAmountBS: item.unitPriceUSD * item.quantity * 0.16 * bcvRate,
                        totalUSD: item.unitPriceUSD * item.quantity * 1.16,
                        totalBS: item.unitPriceUSD * item.quantity * 1.16 * bcvRate
                    }))
                }
            },
            include: {
                items: {
                    include: { product: true }
                },
                customer: true
            }
        })

        // If it's a completed sale (not credit), deduct inventory
        if (documentType === 'SALE') {
            for (const item of items) {
                // Get current stock
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { stock: true }
                })

                if (product) {
                    const previousStock = product.stock || 0
                    const newStock = previousStock - item.quantity

                    // Update product stock
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: newStock }
                    })

                    // Create inventory movement
                    await prisma.inventoryMovement.create({
                        data: {
                            companyId,
                            productId: item.productId,
                            type: 'EXIT',
                            quantity: item.quantity,
                            previousStock,
                            newStock,
                            reason: 'venta',
                            reference: saleNumber,
                            notes: `Venta ${saleNumber}`,
                            userId
                        }
                    })
                }
            }
        }

        // If it's a credit sale, create an account receivable
        // TODO: Add Receivable model to schema and uncomment
        if (paymentMethod === 'CREDIT_SALE' && customerId) {
            console.log(`Credit sale created for customer ${customerId}, due date: ${dueDate}`)
            // Receivable model would be created here when schema is updated
        }

        return NextResponse.json({
            success: true,
            sale,
            message: `${prefix === 'COT' ? 'Presupuesto' : prefix === 'PED' ? 'Pedido' : 'Venta'} creada: ${saleNumber}`
        })
    } catch (error) {
        console.error('Error creating sale:', error)
        return NextResponse.json(
            { success: false, error: 'Error al crear documento' },
            { status: 500 }
        )
    }
}
