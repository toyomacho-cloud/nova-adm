import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ISLR Service rates (simplified - real rates vary by profession)
const ISLR_RATES: Record<string, number> = {
    'PROFESSIONAL_SERVICES': 3.0,
    'TECHNICAL_SERVICES': 2.0,
    'CONSULTING': 3.0,
    'LEGAL': 3.0,
    'ACCOUNTING': 3.0,
    'MEDICAL': 3.0,
    'ENGINEERING': 3.0,
    'MAINTENANCE': 2.0,
    'TRANSPORT': 2.0,
    'OTHER': 2.0,
}

// POST /api/withholdings/islr - Generate ISLR withholding
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { saleId, serviceType, beneficiaryName, beneficiaryRif } = body

        if (!saleId || !serviceType || !beneficiaryName || !beneficiaryRif) {
            return NextResponse.json(
                { error: 'Sale ID, service type, beneficiary name and RIF required' },
                { status: 400 }
            )
        }

        // Get sale
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                companyId: session.user.companyId,
            },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        // Check existing
        const existing = await prisma.iSLRWithholding.findFirst({
            where: { saleId },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'ISLR withholding already exists' },
                { status: 409 }
            )
        }

        // Calculate withholding (using USD amounts)
        const rate = ISLR_RATES[serviceType] || 2.0
        const withholdingAmount = (sale.totalUSD * rate) / 100

        // Generate receipt number
        const count = await prisma.iSLRWithholding.count({
            where: { companyId: session.user.companyId },
        })
        const receiptNumber = `RET-ISLR-${String(count + 1).padStart(6, '0')}`

        const withholding = await prisma.iSLRWithholding.create({
            data: {
                companyId: session.user.companyId,
                saleId: sale.id,
                receiptNumber,
                receiptDate: new Date(),
                beneficiaryName,
                beneficiaryRif,
                concept: serviceType,
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

// GET /api/withholdings/islr
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const withholdings = await prisma.iSLRWithholding.findMany({
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
