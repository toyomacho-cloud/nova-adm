import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCasheaAPI } from '@/lib/casheaAPI'
import prisma from '@/lib/prisma'

// POST /api/cashea/create-payment - Create Cashea payment link
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { saleId, amount, currency, customerEmail, customerPhone } = body

        if (!saleId || !amount) {
            return NextResponse.json(
                { error: 'Sale ID and amount required' },
                { status: 400 }
            )
        }

        // Get sale details
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                companyId: session.user.companyId,
            },
            include: { customer: true },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        // Create payment with Cashea
        const cashea = getCasheaAPI()
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        const payment = await cashea.createPayment({
            amount: parseFloat(amount),
            currency: currency || 'USD',
            description: `Factura ${sale.invoiceNumber}`,
            reference: sale.invoiceNumber,
            customerEmail: customerEmail || sale.customer.email || '',
            customerPhone: customerPhone || sale.customer.phone || '',
            callbackUrl: `${baseUrl}/api/cashea/webhook`,
            returnUrl: `${baseUrl}/dashboard/ventas?payment=success`,
        })

        // Save Cashea transaction
        const transaction = await prisma.casheaTransaction.create({
            data: {
                companyId: session.user.companyId,
                saleId: sale.id,
                paymentId: payment.paymentId,
                amount: parseFloat(amount),
                currency: currency || 'USD',
                status: 'pending',
                paymentUrl: payment.paymentUrl,
                qrCode: payment.qrCode,
                reference: payment.reference,
                expiresAt: new Date(payment.expiresAt),
            },
        })

        return NextResponse.json({
            success: true,
            paymentUrl: payment.paymentUrl,
            qrCode: payment.qrCode,
            paymentId: payment.paymentId,
            transaction,
        })
    } catch (error) {
        console.error('Cashea payment creation error:', error)
        return NextResponse.json(
            { error: 'Error creating payment' },
            { status: 500 }
        )
    }
}

// GET /api/cashea/create-payment - Get all Cashea transactions
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        const where: any = {
            companyId: session.user.companyId,
        }

        if (status) {
            where.status = status
        }

        const transactions = await prisma.casheaTransaction.findMany({
            where,
            include: {
                sale: {
                    include: {
                        customer: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, transactions })
    } catch (error) {
        console.error('Error fetching Cashea transactions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
