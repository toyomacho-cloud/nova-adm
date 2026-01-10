import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/sales/[id]/pay - Process payment for an order
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { paymentMethodId } = body

        if (!paymentMethodId) {
            return NextResponse.json(
                { error: 'Payment method is required' },
                { status: 400 }
            )
        }

        // Find the order
        const order = await prisma.sale.findUnique({
            where: {
                id,
                companyId: session.user.companyId,
            },
            include: {
                items: true,
                customer: true,
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        if (order.paymentStatus === 'PAID') {
            return NextResponse.json(
                { error: 'This order is already paid' },
                { status: 400 }
            )
        }

        // Check if there's an open cash register
        const cashRegister = await prisma.cashRegister.findFirst({
            where: {
                companyId: session.user.companyId,
                closedAt: null,
            },
        })

        if (!cashRegister) {
            return NextResponse.json(
                { error: 'No hay caja abierta. Debe abrir la caja antes de cobrar.' },
                { status: 400 }
            )
        }

        // Get payment method details
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: paymentMethodId },
        })

        if (!paymentMethod) {
            return NextResponse.json(
                { error: 'Payment method not found' },
                { status: 404 }
            )
        }

        // Generate invoice number
        const salesCount = await prisma.sale.count({
            where: {
                companyId: session.user.companyId,
                invoiceNumber: { not: null },
            },
        })
        const invoiceNumber = `FAC-${String(salesCount + 1).padStart(6, '0')}`

        // Update the order to mark as paid
        const updatedSale = await prisma.sale.update({
            where: { id },
            data: {
                paymentMethodId,
                paymentStatus: 'PAID',
                documentType: 'SALE',
                status: 'COMPLETED',
                invoiceNumber,
                invoiceDate: new Date(),
                paidAt: new Date(),
            },
            include: {
                items: true,
                customer: true,
                paymentMethod: true,
            },
        })

        // Register cash transaction
        const amount = paymentMethod.currency === 'USD'
            ? order.totalUSD
            : order.totalBS

        await prisma.cashTransaction.create({
            data: {
                cashRegisterId: cashRegister.id,
                companyId: session.user.companyId,
                userId: session.user.id,
                type: 'SALE',
                amount,
                description: `Pago de pedido ${order.saleNumber}`,
                reference: invoiceNumber,
                paymentMethodId,
            },
        })

        // Update cash register expected balance
        if (paymentMethod.currency === 'USD') {
            await prisma.cashRegister.update({
                where: { id: cashRegister.id },
                data: {
                    expectedBalanceUSD: {
                        increment: order.totalUSD,
                    },
                },
            })
        } else {
            await prisma.cashRegister.update({
                where: { id: cashRegister.id },
                data: {
                    expectedBalanceBS: {
                        increment: order.totalBS,
                    },
                },
            })
        }

        return NextResponse.json({
            success: true,
            sale: updatedSale,
            invoiceNumber,
            message: 'Pago procesado exitosamente',
        })
    } catch (error) {
        console.error('Error processing payment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
