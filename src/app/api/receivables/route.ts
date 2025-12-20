import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/receivables - Get accounts receivable
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'all' // all, pending, paid, overdue

        const where: any = {
            companyId: session.user.companyId,
        }

        if (status !== 'all') {
            if (status === 'overdue') {
                where.dueDate = { lt: new Date() }
                where.paymentStatus = { not: 'PAID' }
            } else {
                where.paymentStatus = status.toUpperCase()
            }
        }

        // Get sales as receivables (simplified - sales are immediate CxC)
        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: true,
                paymentMethod: true,
            },
            orderBy: { invoiceDate: 'desc' },
        })

        // Transform to receivable format
        const receivables = sales.map((sale: any) => ({
            id: sale.id,
            invoiceNumber: sale.invoiceNumber,
            invoiceDate: sale.invoiceDate,
            dueDate: new Date(sale.invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
            customer: sale.customer,
            totalUSD: sale.totalUSD,
            totalBS: sale.totalBS,
            paidAmountUSD: sale.paymentStatus === 'PAID' ? sale.totalUSD : 0,
            paidAmountBS: sale.paymentStatus === 'PAID' ? sale.totalBS : 0,
            balanceUSD: sale.paymentStatus === 'PAID' ? 0 : sale.totalUSD,
            balanceBS: sale.paymentStatus === 'PAID' ? 0 : sale.totalBS,
            paymentStatus: sale.paymentStatus,
            paymentMethod: sale.paymentMethod,
        }))

        return NextResponse.json({
            success: true,
            receivables,
        })
    } catch (error) {
        console.error('Error fetching receivables:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
