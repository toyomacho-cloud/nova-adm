import { NextRequest, NextResponse } from 'next/server'
import { getCasheaAPI } from '@/lib/casheaAPI'
import prisma from '@/lib/prisma'

// POST /api/cashea/webhook - Webhook handler for Cashea payment notifications
export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-cashea-signature') || ''
        const body = await req.text()

        // Verify webhook signature
        const cashea = getCasheaAPI()
        const isValid = cashea.verifyWebhookSignature(body, signature)

        if (!isValid) {
            console.error('Invalid Cashea webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(body)
        const { event, paymentId, reference, amount, commission, netAmount, paidAt } = payload

        // Find transaction
        const transaction = await prisma.casheaTransaction.findFirst({
            where: { paymentId },
            include: { sale: true },
        })

        if (!transaction) {
            console.error('Cashea transaction not found:', paymentId)
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Handle different events
        switch (event) {
            case 'payment.approved':
                // Update transaction
                await prisma.casheaTransaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'approved',
                        commission: commission || 0,
                        netAmount: netAmount || amount,
                        paidAt: paidAt ? new Date(paidAt) : new Date(),
                    },
                })

                // Update sale payment status
                if (transaction.sale) {
                    await prisma.sale.update({
                        where: { id: transaction.saleId! },
                        data: { status: 'PAID' },
                    })

                    // Create payment record
                    const paymentMethod = await prisma.paymentMethod.findFirst({
                        where: {
                            companyId: transaction.companyId,
                            name: 'Cashea',
                        },
                    })

                    if (paymentMethod) {
                        await prisma.salePayment.create({
                            data: {
                                saleId: transaction.saleId!,
                                paymentMethodId: paymentMethod.id,
                                amount: netAmount || amount,
                                paymentDate: new Date(),
                                reference: paymentId,
                            },
                        })
                    }
                }
                break

            case 'payment.rejected':
                await prisma.casheaTransaction.update({
                    where: { id: transaction.id },
                    data: { status: 'rejected' },
                })
                break

            case 'payment.expired':
                await prisma.casheaTransaction.update({
                    where: { id: transaction.id },
                    data: { status: 'expired' },
                })
                break
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' })
    } catch (error) {
        console.error('Cashea webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

// Verify webhook (for testing)
export async function GET(req: NextRequest) {
    return NextResponse.json({ message: 'Cashea webhook endpoint is active' })
}
