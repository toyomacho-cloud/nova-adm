import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/fiscal-books/purchases - Libro de Compras
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

        const purchases = await prisma.purchase.findMany({
            where: {
                companyId: session.user.companyId,
                invoiceDate: { gte: startDate, lte: endDate },
            },
            include: {
                vendor: true,
            },
            orderBy: { invoiceDate: 'asc' },
        })

        const totals = {
            transactions: purchases.length,
            subtotal: purchases.reduce((sum: number, p: any) => sum + p.subtotal, 0),
            tax: purchases.reduce((sum: number, p: any) => sum + p.taxAmount, 0),
            total: purchases.reduce((sum: number, p: any) => sum + p.total, 0),
        }

        const byVendor: Record<string, any> = {}
        purchases.forEach((purchase: any) => {
            const key = purchase.vendor.rif
            if (!byVendor[key]) {
                byVendor[key] = {
                    vendor: purchase.vendor,
                    transactions: 0,
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                }
            }
            byVendor[key].transactions++
            byVendor[key].subtotal += purchase.subtotal
            byVendor[key].tax += purchase.taxAmount
            byVendor[key].total += purchase.total
        })

        return NextResponse.json({
            success: true,
            period: { month, year, startDate, endDate },
            totals,
            purchases,
            byVendor: Object.values(byVendor),
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
