import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/reports/sales - Sales reports
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const period = searchParams.get('period') || 'today' // today, week, month, year

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

        // Get sales in period
        const sales = await prisma.sale.findMany({
            where: {
                companyId: session.user.companyId,
                invoiceDate: { gte: startDate },
            },
            include: {
                customer: true,
                paymentMethod: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { invoiceDate: 'desc' },
        })

        // Calculate totals
        const totalSalesUSD = sales.reduce((sum: number, s: any) => sum + s.totalUSD, 0)
        const totalSalesBS = sales.reduce((sum: number, s: any) => sum + s.totalBS, 0)
        const transactionCount = sales.length

        // Group by payment method
        const byPaymentMethod: Record<string, { count: number; totalUSD: number; totalBS: number }> = {}
        sales.forEach((sale: any) => {
            const method = sale.paymentMethod.name
            if (!byPaymentMethod[method]) {
                byPaymentMethod[method] = { count: 0, totalUSD: 0, totalBS: 0 }
            }
            byPaymentMethod[method].count++
            byPaymentMethod[method].totalUSD += sale.totalUSD
            byPaymentMethod[method].totalBS += sale.totalBS
        })

        // Top products
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
        sales.forEach((sale: any) => {
            sale.items.forEach((item: any) => {
                const productId = item.productId || 'unknown'
                const productName = item.description

                if (!productSales[productId]) {
                    productSales[productId] = { name: productName, quantity: 0, revenue: 0 }
                }
                productSales[productId].quantity += item.quantity
                productSales[productId].revenue += item.totalUSD
            })
        })

        const topProducts = Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        // Top customers
        const customerSales: Record<string, { name: string; count: number; revenue: number }> = {}
        sales.forEach((sale: any) => {
            const customerId = sale.customerId
            const customerName = sale.customer.name

            if (!customerSales[customerId]) {
                customerSales[customerId] = { name: customerName, count: 0, revenue: 0 }
            }
            customerSales[customerId].count++
            customerSales[customerId].revenue += sale.totalUSD
        })

        const topCustomers = Object.entries(customerSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        return NextResponse.json({
            success: true,
            report: {
                period,
                startDate,
                endDate: new Date(),
                summary: {
                    totalSalesUSD,
                    totalSalesBS,
                    transactionCount,
                    averageTicketUSD: transactionCount > 0 ? totalSalesUSD / transactionCount : 0,
                },
                byPaymentMethod,
                topProducts,
                topCustomers,
            },
        })
    } catch (error) {
        console.error('Error generating report:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
