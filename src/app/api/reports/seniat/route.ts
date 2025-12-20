import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/reports/seniat - SENIAT consolidated report
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const month = searchParams.get('month') || new Date().getMonth() + 1
        const year = searchParams.get('year') || new Date().getFullYear()

        const startDate = new Date(Number(year), Number(month) - 1, 1)
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)

        // Get all withholdings for period
        const [ivaWithholdings, islrWithholdings, municipalWithholdings, sales] = await Promise.all([
            prisma.iVAWithholding.findMany({
                where: {
                    companyId: session.user.companyId,
                    receiptDate: { gte: startDate, lte: endDate },
                },
                include: { sale: true, purchase: true },
                orderBy: { receiptDate: 'asc' },
            }),
            prisma.iSLRWithholding.findMany({
                where: {
                    companyId: session.user.companyId,
                    receiptDate: { gte: startDate, lte: endDate },
                },
                include: { sale: true },
                orderBy: { receiptDate: 'asc' },
            }),
            prisma.municipalWithholding.findMany({
                where: {
                    companyId: session.user.companyId,
                    receiptDate: { gte: startDate, lte: endDate },
                },
                include: { sale: true },
                orderBy: { receiptDate: 'asc' },
            }),
            prisma.sale.findMany({
                where: {
                    companyId: session.user.companyId,
                    invoiceDate: { gte: startDate, lte: endDate },
                },
                include: { customer: true },
                orderBy: { invoiceDate: 'asc' },
            }),
        ])

        // Calculate totals
        const totals = {
            sales: {
                count: sales.length,
                subtotalUSD: sales.reduce((sum: number, s: any) => sum + s.subtotalUSD, 0),
                taxUSD: sales.reduce((sum: number, s: any) => sum + s.taxAmountUSD, 0),
                totalUSD: sales.reduce((sum: number, s: any) => sum + s.totalUSD, 0),
            },
            iva: {
                count: ivaWithholdings.length,
                totalWithheld: ivaWithholdings.reduce((sum: number, w: any) => sum + w.withholdingAmount, 0),
            },
            islr: {
                count: islrWithholdings.length,
                totalWithheld: islrWithholdings.reduce((sum: number, w: any) => sum + w.withholdingAmount, 0),
            },
            municipal: {
                count: municipalWithholdings.length,
                totalWithheld: municipalWithholdings.reduce((sum: number, w: any) => sum + w.withholdingAmount, 0),
            },
        }

        return NextResponse.json({
            success: true,
            period: { month, year, startDate, endDate },
            totals,
            detail: {
                ivaWithholdings,
                islrWithholdings,
                municipalWithholdings,
                sales,
            },
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
