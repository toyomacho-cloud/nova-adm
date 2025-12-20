import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/company - Get company settings
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
        })

        return NextResponse.json({ success: true, company })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/company - Update company settings
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, rif, address, phone, email, taxRate, logo } = body

        const company = await prisma.company.update({
            where: { id: session.user.companyId },
            data: {
                name: name || undefined,
                rif: rif || undefined,
                address: address || undefined,
                phone: phone || undefined,
                email: email || undefined,
                ivaRate: taxRate !== undefined ? taxRate : undefined,
                logo: logo || undefined,
            },
        })

        return NextResponse.json({ success: true, company })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
