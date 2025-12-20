import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/withholdings/municipal - Generate municipal withholding (1%)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { saleId, municipality, beneficiaryName, beneficiaryRif, concept } = body

        if (!saleId || !municipality || !beneficiaryName || !beneficiaryRif) {
            return NextResponse.json({ error: 'Sale ID, municipality, beneficiary name and RIF required' }, { status: 400 })
        }

        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                companyId: session.user.companyId,
            },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        const existing = await prisma.municipalWithholding.findFirst({
            where: { saleId },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Municipal withholding already exists' },
                { status: 409 }
            )
        }

        // Municipal withholding is always 1% of subtotal
        const rate = 1.0
        const withholdingAmount = (sale.totalUSD * rate) / 100

        const count = await prisma.municipalWithholding.count({
            where: { companyId: session.user.companyId },
        })
        const receiptNumber = `RET-MUN-${String(count + 1).padStart(6, '0')}`

        const withholding = await prisma.municipalWithholding.create({
            data: {
                companyId: session.user.companyId,
                saleId: sale.id,
                receiptNumber,
                receiptDate: new Date(),
                municipality,
                beneficiaryName,
                beneficiaryRif,
                concept: concept || 'Municipal Tax Withholding',
                baseAmount: sale.totalUSD,
                withholdingRate: rate,
                withholdingAmount,
                status: 'PENDING',
            },
            include: {
                sale: true,
            },
        })

        return NextResponse.json({ success: true, withholding })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET /api/withholdings/municipal
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const withholdings = await prisma.municipalWithholding.findMany({
            where: { companyId: session.user.companyId },
            include: {
                sale: true,
            },
            orderBy: { receiptDate: 'desc' },
        })

        return NextResponse.json({ success: true, withholdings })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
