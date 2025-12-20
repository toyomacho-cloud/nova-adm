import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/sales - Create new sale
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { customerId, paymentMethodId, items, notes } = body

        // Validation
        if (!customerId || !paymentMethodId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Customer, payment method, and items are required' },
                { status: 400 }
            )
        }

        // Get BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })
        const rate = bcvRate?.rate || 276.58

        // Validate stock and calculate totals
        let subtotalUSD = 0
        let subtotalBS = 0
        const validatedItems = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) {
                return NextResponse.json(
                    { error: `Product ${item.productId} not found` },
                    { status: 404 }
                )
            }

            if (product.stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
                    { status: 400 }
                )
            }

            const itemSubtotalUSD = product.priceUSD * item.quantity
            const itemSubtotalBS = product.priceBS * item.quantity

            subtotalUSD += itemSubtotalUSD
            subtotalBS += itemSubtotalBS

            validatedItems.push({
                productId: product.id,
                description: product.name,
                quantity: item.quantity,
                unitPriceUSD: product.priceUSD,
                unitPriceBS: product.priceBS,
                subtotalUSD: itemSubtotalUSD,
                subtotalBS: itemSubtotalBS,
            })
        }

        // Calculate tax (16% IVA)
        const taxRate = 0.16
        const taxAmountUSD = subtotalUSD * taxRate
        const taxAmountBS = subtotalBS * taxRate
        const totalUSD = subtotalUSD + taxAmountUSD
        const totalBS = subtotalBS + taxAmountBS

        // Generate sale number and invoice number
        const salesCount = await prisma.sale.count({
            where: { companyId: session.user.companyId },
        })
        const saleNumber = `VEN-${String(salesCount + 1).padStart(6, '0')}`
        const invoiceNumber = `FAC-${String(salesCount + 1).padStart(6, '0')}`

        // Create sale with items
        const sale = await prisma.sale.create({
            data: {
                companyId: session.user.companyId,
                customerId,
                userId: session.user.id,
                paymentMethodId,
                saleNumber,
                invoiceNumber,
                invoiceDate: new Date(),
                subtotalUSD,
                subtotalBS,
                taxAmountUSD,
                taxAmountBS,
                taxRate: 16.0,
                totalUSD,
                totalBS,
                bcvRate: rate,
                paymentStatus: 'PAID', // Asumimos pago inmediato desde POS
                status: 'COMPLETED',
                notes: notes || null,
                items: {
                    create: validatedItems.map((item: any) => ({
                        productId: item.productId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPriceUSD: item.unitPriceUSD,
                        unitPriceBS: item.unitPriceBS,
                        subtotalUSD: item.subtotalUSD,
                        subtotalBS: item.subtotalBS,
                        taxAmountUSD: item.subtotalUSD * taxRate,
                        taxAmountBS: item.subtotalBS * taxRate,
                        totalUSD: item.subtotalUSD * (1 + taxRate),
                        totalBS: item.subtotalBS * (1 + taxRate),
                    })),
                },
            },
            include: {
                items: true,
                customer: true,
                paymentMethod: true,
            },
        })

        // Update stock for each product
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            })
        }

        return NextResponse.json({
            success: true,
            sale,
            message: 'Sale created successfully',
        })
    } catch (error) {
        console.error('Error creating sale:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/sales - List all sales
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const sales = await prisma.sale.findMany({
            where: {
                companyId: session.user.companyId,
            },
            include: {
                customer: true,
                paymentMethod: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        return NextResponse.json({
            success: true,
            sales,
        })
    } catch (error) {
        console.error('Error fetching sales:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
