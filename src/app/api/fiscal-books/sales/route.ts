import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/fiscal-books/sales - Libro de Ventas
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        // Get all sales for the period
        const sales = await prisma.sale.findMany({
            where: {
                companyId: session.user.companyId,
                invoiceDate: { gte: startDate, lte: endDate },
            },
            include: {
                customer: true,
                paymentMethod: true,
            },
            orderBy: { invoiceDate: 'asc' },
        })

        // Calculate totals
        const totals = {
            transactions: sales.length,
            subtotalUSD: sales.reduce((sum, s) => sum + (s.subtotalUSD || 0), 0),
            taxUSD: sales.reduce((sum, s) => sum + (s.taxAmountUSD || 0), 0),
            totalUSD: sales.reduce((sum, s) => sum + (s.totalUSD || 0), 0),
            subtotalBS: sales.reduce((sum, s) => sum + (s.subtotalBS || 0), 0),
            taxBS: sales.reduce((sum, s) => sum + (s.taxAmountBS || 0), 0),
            totalBS: sales.reduce((sum, s) => sum + (s.totalBS || 0), 0),
        }

        // Group by customer
        const byCustomer: Record<string, any> = {}
        sales.forEach((sale) => {
            const key = sale.customer.rif
            if (!byCustomer[key]) {
                byCustomer[key] = {
                    customer: sale.customer,
                    transactions: 0,
                    subtotalUSD: 0,
                    taxUSD: 0,
                    totalUSD: 0,
                }
            }
            byCustomer[key].transactions++
            byCustomer[key].subtotalUSD += sale.subtotalUSD || 0
            byCustomer[key].taxUSD += sale.taxAmountUSD || 0
            byCustomer[key].totalUSD += sale.totalUSD || 0
        })

        return NextResponse.json({
            success: true,
            period: { month, year, startDate, endDate },
            totals,
            sales,
            byCustomer: Object.values(byCustomer),
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
