import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { Cargo } from '@/lib/cargos'
import { getNombreCargo } from '@/lib/cargos'

// Cargos permitidos para procesar ventas (equivalente a @requerir_cargo)
const CARGOS_PROCESAR_VENTA: Cargo[] = ['PRESIDENTE', 'VENDEDOR', 'CAJERA']

// POST /api/sales - Create new sale or order
// @requerir_cargo([Cargo.PRESIDENTE, Cargo.VENDEDOR, Cargo.CAJERA])
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verificar cargo para procesar ventas
        const cargoUsuario = session.user.role as Cargo
        if (!CARGOS_PROCESAR_VENTA.includes(cargoUsuario)) {
            const nombreCargo = getNombreCargo(cargoUsuario)
            return NextResponse.json(
                {
                    error: `Acceso denegado. Tu cargo de ${nombreCargo} no permite procesar ventas.`,
                    cargoRequerido: CARGOS_PROCESAR_VENTA.map(getNombreCargo).join(', '),
                    cargoActual: nombreCargo,
                },
                { status: 403 }
            )
        }

        const body = await req.json()
        const {
            customerId,
            paymentMethodId,
            items,
            notes,
            documentType = 'ORDER' // ORDER (from POS) or SALE (direct sale)
        } = body

        // Validation - paymentMethodId is optional for orders
        if (!customerId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Customer and items are required' },
                { status: 400 }
            )
        }

        // Get BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })
        const rate = bcvRate?.rate || 276.58

        // OPTIMIZED: Fetch ALL products in ONE query instead of N+1 queries
        // This reduces database calls from N+1 to just 1 (~80% improvement)
        const productIds = items.map((item: any) => item.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                priceUSD: true,
                priceBS: true,
                stock: true,
            },
        })

        // Create a map for O(1) lookup
        const productMap = new Map(products.map(p => [p.id, p]))

        // Validate stock and calculate totals
        let subtotalUSD = 0
        let subtotalBS = 0
        const validatedItems = []

        for (const item of items) {
            const product = productMap.get(item.productId)

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

        // Generate sale/order number
        const salesCount = await prisma.sale.count({
            where: { companyId: session.user.companyId },
        })

        // Use different prefixes for each document type
        const isQuote = documentType === 'QUOTE'
        const isOrder = documentType === 'ORDER'
        const isDirect = documentType === 'SALE'

        let saleNumber: string
        if (isQuote) {
            saleNumber = `PRE-${String(salesCount + 1).padStart(6, '0')}`  // Presupuesto
        } else if (isOrder) {
            saleNumber = `PED-${String(salesCount + 1).padStart(6, '0')}`  // Pedido
        } else {
            saleNumber = `VEN-${String(salesCount + 1).padStart(6, '0')}`  // Venta directa
        }

        // Invoice number only generated when paid (for orders/quotes, this happens later)
        const invoiceNumber = isDirect ? `FAC-${String(salesCount + 1).padStart(6, '0')}` : null

        // Create sale/order with items
        const sale = await prisma.sale.create({
            data: {
                companyId: session.user.companyId,
                customerId,
                userId: session.user.id,
                paymentMethodId: paymentMethodId || null,
                saleNumber,
                invoiceNumber,
                invoiceDate: isDirect ? new Date() : null,
                quotedAt: isQuote ? new Date() : null,
                orderedAt: isOrder ? new Date() : null,
                documentType,
                subtotalUSD,
                subtotalBS,
                taxAmountUSD,
                taxAmountBS,
                taxRate: 16.0,
                totalUSD,
                totalBS,
                bcvRate: rate,
                paymentStatus: isDirect ? 'PAID' : 'PENDING',
                status: isDirect ? 'COMPLETED' : 'ACTIVE',
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

        // Update stock for each product (reserve stock even for orders)
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

        // Success message based on document type
        let message = 'Documento creado exitosamente'
        if (isQuote) message = 'Presupuesto creado exitosamente'
        else if (isOrder) message = 'Pedido creado exitosamente'
        else if (isDirect) message = 'Venta completada exitosamente'

        return NextResponse.json({
            success: true,
            sale,
            message,
            orderNumber: sale.saleNumber,
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
        const paymentStatus = searchParams.get('paymentStatus') // Filter by payment status
        const documentType = searchParams.get('documentType') // Filter by document type

        const sales = await prisma.sale.findMany({
            where: {
                companyId: session.user.companyId,
                ...(paymentStatus && { paymentStatus }),
                ...(documentType && { documentType }),
            },
            include: {
                customer: true,
                paymentMethod: true,
                items: true,
                user: {
                    select: { name: true }
                },
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
