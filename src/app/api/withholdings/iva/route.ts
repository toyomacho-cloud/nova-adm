import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/withholdings/iva - Generate IVA withholding from a sale
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { saleId } = body

        if (!saleId) {
            return NextResponse.json({ error: 'Sale ID required' }, { status: 400 })
        }

        // Get sale
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                companyId: session.user.companyId,
            },
            include: {
                customer: true,
            },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        // Check if withholding already exists
        const existing = await prisma.iVAWithholding.findFirst({
            where: { saleId },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Withholding already exists for this sale' },
                { status: 409 }
            )
        }

        // Calculate withholding
        // Special taxpayers: 75% of IVA
        // Regular: 100% of IVA
        const rate = sale.customer.isSpecialTaxpayer ? 75 : 100
        const withholdingAmount = (sale.taxAmountUSD * rate) / 100

        // Generate receipt number
        const count = await prisma.iVAWithholding.count({
            where: { companyId: session.user.companyId },
        })
        const receiptNumber = `RET-IVA-${String(count + 1).padStart(6, '0')}`

        // Create withholding
        const withholding = await prisma.iVAWithholding.create({
            data: {
                companyId: session.user.companyId,
                saleId: sale.id,
                receiptNumber,
                receiptDate: new Date(),
                baseAmount: sale.subtotalUSD,
                withholdingRate: rate,
                withholdingAmount,
                status: 'PENDING',
            },
            include: {
                sale: true,
            },
        })

        return NextResponse.json({
            success: true,
            withholding,
        })
    } catch (error) {
        console.error('Error creating withholding:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET /api/withholdings/iva - List IVA withholdings
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'all'

        const where: any = {
            companyId: session.user.companyId,
        }

        if (status !== 'all') {
            where.status = status.toUpperCase()
        }

        const withholdings = await prisma.iVAWithholding.findMany({
            where,
            include: {
                sale: true,
                purchase: true,
            },
            orderBy: { receiptDate: 'desc' },
        })

        return NextResponse.json({
            success: true,
            withholdings,
        })
    } catch (error) {
        console.error('Error fetching withholdings:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
