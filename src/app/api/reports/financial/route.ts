import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/reports/financial - Financial dashboard data
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const period = searchParams.get('period') || 'month' // today, week, month, year

        let startDate = new Date()
        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0)
                break
            case 'week':
                startDate.setDate(startDate.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1)
                break
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1)
                break
        }

        // Get all relevant data
        const [sales, purchases, customers, products, receivables] = await Promise.all([
            prisma.sale.findMany({
                where: {
                    companyId: session.user.companyId,
                    invoiceDate: { gte: startDate },
                },
            }),
            prisma.purchase.findMany({
                where: {
                    companyId: session.user.companyId,
                    invoiceDate: { gte: startDate },
                },
            }),
            prisma.customer.findMany({
                where: { companyId: session.user.companyId },
            }),
            prisma.product.findMany({
                where: { companyId: session.user.companyId },
            }),
            prisma.sale.findMany({
                where: {
                    companyId: session.user.companyId,
                    status: { not: 'PAID' },
                },
            }),
        ])

        // Calculate metrics (using USD)
        const totalRevenue = sales.reduce((sum, s) => sum + (s.totalUSD || 0), 0)
        const totalCosts = purchases.reduce((sum, p) => sum + p.total, 0)
        const grossProfit = totalRevenue - totalCosts

        const totalReceivables = receivables.reduce((sum, r) => sum + (r.totalUSD || 0), 0)

        const inventoryValue = products.reduce(
            (sum, p) => sum + p.stock * (p.priceUSD || 0),
            0
        )

        const lowStockProducts = products.filter((p) => p.stock <= p.minStock)

        return NextResponse.json({
            success: true,
            period,
            metrics: {
                revenue: {
                    total: totalRevenue,
                    count: sales.length,
                    average: sales.length > 0 ? totalRevenue / sales.length : 0,
                },
                costs: {
                    total: totalCosts,
                    count: purchases.length,
                },
                profit: {
                    gross: grossProfit,
                    margin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
                },
                receivables: {
                    total: totalReceivables,
                    count: receivables.length,
                },
                inventory: {
                    value: inventoryValue,
                    products: products.length,
                    lowStock: lowStockProducts.length,
                },
                customers: {
                    total: customers.length,
                    active: sales.length > 0 ? new Set(sales.map((s) => s.customerId)).size : 0,
                },
            },
            recentSales: sales.slice(0, 10).sort((a, b) =>
                new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
            ),
            recentPurchases: purchases.slice(0, 10).sort((a, b) =>
                new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
            ),
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
