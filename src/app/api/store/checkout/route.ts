import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCasheaAPI } from '@/lib/casheaAPI'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/store/checkout - Create order and initiate Cashea payment
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerRif,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingZip,
            items,
            paymentMethod,
            notes,
        } = body

        if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })

        // Calculate totals
        let subtotal = 0
        const orderItems = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
            })

            if (!product || product.stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${product?.name || 'product'}` },
                    { status: 400 }
                )
            }

            const itemSubtotal = product.priceUSD * item.quantity
            subtotal += itemSubtotal

            orderItems.push({
                productId: product.id,
                description: product.name,
                sku: product.sku,
                quantity: item.quantity,
                unitPrice: product.priceUSD,
                subtotal: itemSubtotal,
            })
        }

        const shipping = subtotal >= 50 ? 0 : 5
        const tax = (subtotal + shipping) * 0.16
        const total = subtotal + shipping + tax

        // Generate order number
        const orderCount = await prisma.onlineOrder.count()
        const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

        // Create order
        const order = await prisma.onlineOrder.create({
            data: {
                companyId: 'default-company-id', // Use first company or get from session
                orderNumber,
                customerName,
                customerEmail,
                customerPhone,
                customerRif: customerRif || null,
                shippingAddress,
                shippingCity,
                shippingState,
                shippingZip,
                subtotal,
                shipping,
                tax,
                total,
                currency: 'USD',
                bcvRate: bcvRate?.rate || 0,
                paymentMethod: paymentMethod || 'cashea',
                paymentStatus: 'pending',
                orderStatus: 'pending',
                notes,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: true,
            },
        })

        // If Cashea payment, create payment link
        let casheaPayment = null
        if (paymentMethod === 'cashea') {
            const cashea = getCasheaAPI()
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

            casheaPayment = await cashea.createPayment({
                amount: total,
                currency: 'USD',
                description: `Orden ${orderNumber}`,
                reference: orderNumber,
                customerEmail,
                customerPhone,
                callbackUrl: `${baseUrl}/api/store/payment-webhook`,
                returnUrl: `${baseUrl}/store/orden/${order.id}`,
            })

            // Save Cashea payment ID
            await prisma.onlineOrder.update({
                where: { id: order.id },
                data: { casheaPaymentId: casheaPayment.paymentId },
            })
        }

        return NextResponse.json({
            success: true,
            order,
            casheaPayment,
        })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
    }
}
