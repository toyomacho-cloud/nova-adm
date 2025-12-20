import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/receivables/:id/payment - Register payment
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { amountUSD, paymentMethodId, notes } = body

        if (!amountUSD || !paymentMethodId) {
            return NextResponse.json(
                { error: 'Amount and payment method required' },
                { status: 400 }
            )
        }

        // Get sale (using as receivable)
        const sale = await prisma.sale.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        // Calculate paid and balance
        const existingPayments = await prisma.salePayment.findMany({
            where: { saleId: params.id },
        })

        const totalPaid = existingPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
        const newTotal = totalPaid + parseFloat(amountUSD)

        if (newTotal > sale.totalUSD) {
            return NextResponse.json(
                { error: 'Payment exceeds invoice total' },
                { status: 400 }
            )
        }

        // Create payment
        const payment = await prisma.salePayment.create({
            data: {
                saleId: params.id,
                paymentMethodId,
                amount: parseFloat(amountUSD),
                paymentDate: new Date(),
                reference: notes || null,
            },
            include: {
                paymentMethod: true,
            },
        })

        // Update sale status
        const newStatus = newTotal >= sale.totalUSD ? 'PAID' : 'PARTIAL'
        await prisma.sale.update({
            where: { id: params.id },
            data: { paymentStatus: newStatus },
        })

        return NextResponse.json({ success: true, payment })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
