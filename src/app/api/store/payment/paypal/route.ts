import { NextRequest, NextResponse } from 'next/server'
import { getPayPalAPI } from '@/lib/paypalAPI'
import prisma from '@/lib/prisma'

// POST /api/store/payment/paypal - Create PayPal payment
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { orderId, amount } = body

        if (!orderId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get order details
        const order = await prisma.onlineOrder.findUnique({
            where: { id: orderId },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Create PayPal payment
        const paypal = getPayPalAPI()
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        const payment = await paypal.createOrder({
            amount: order.total,
            currency: 'USD',
            description: `Orden ${order.orderNumber}`,
            reference: order.orderNumber,
            returnUrl: `${baseUrl}/store/orden/${order.id}?source=paypal`,
            cancelUrl: `${baseUrl}/store/checkout?cancelled=true`,
        })

        // Save PayPal order ID
        await prisma.onlineOrder.update({
            where: { id: order.id },
            data: {
                paymentMethod: 'paypal',
                notes: `PayPal Order ID: ${payment.orderId}`,
            },
        })

        return NextResponse.json({
            success: true,
            approvalUrl: payment.approvalUrl,
            orderId: payment.orderId,
        })
    } catch (error) {
        console.error('PayPal payment error:', error)
        return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
    }
}

// GET /api/store/payment/paypal/capture?token=xxx - Capture PayPal payment
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 })
        }

        const paypal = getPayPalAPI()
        const result = await paypal.captureOrder(token)

        if (result.status === 'COMPLETED') {
            // Find and update order
            const order = await prisma.onlineOrder.findFirst({
                where: {
                    notes: { contains: token },
                },
            })

            if (order) {
                await prisma.onlineOrder.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'paid',
                        orderStatus: 'confirmed',
                    },
                })

                // Deduct stock
                const items = await prisma.onlineOrderItem.findMany({
                    where: { orderId: order.id },
                })

                for (const item of items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    })
                }
            }

            return NextResponse.json({ success: true, order })
        }

        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    } catch (error) {
        console.error('PayPal capture error:', error)
        return NextResponse.json({ error: 'Capture failed' }, { status: 500 })
    }
}
