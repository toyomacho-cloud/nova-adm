import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/store/payment/pago-movil - Register Pago Móvil payment
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            orderId,
            phoneNumber,
            bank,
            referenceNumber,
            amount,
            paymentDate
        } = body

        if (!orderId || !phoneNumber || !bank || !referenceNumber || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get order
        const order = await prisma.onlineOrder.findUnique({
            where: { id: orderId },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Update order with Pago Móvil info
        await prisma.onlineOrder.update({
            where: { id: order.id },
            data: {
                paymentMethod: 'pago_movil',
                paymentStatus: 'pending_verification',
                orderStatus: 'pending_payment',
                notes: `Pago Móvil - Banco: ${bank}, Tel: ${phoneNumber}, Ref: ${referenceNumber}, Monto: ${amount}`,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Pago registrado. Será verificado en 24-48 horas.',
            order,
        })
    } catch (error) {
        console.error('Pago Móvil error:', error)
        return NextResponse.json({ error: 'Payment registration failed' }, { status: 500 })
    }
}

// PATCH /api/store/payment/pago-movil/verify - Verify Pago Móvil (Admin only)
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { orderId, approved } = body

        const order = await prisma.onlineOrder.update({
            where: { id: orderId },
            data: {
                paymentStatus: approved ? 'paid' : 'rejected',
                orderStatus: approved ? 'confirmed' : 'cancelled',
            },
        })

        // If approved, deduct stock
        if (approved) {
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
    } catch (error) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
