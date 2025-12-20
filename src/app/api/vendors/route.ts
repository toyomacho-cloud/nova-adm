import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/vendors - List vendors
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''

        const where: any = {
            companyId: session.user.companyId,
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { rif: { contains: search } },
                { email: { contains: search } },
            ]
        }

        const vendors = await prisma.vendor.findMany({
            where,
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ success: true, vendors })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/vendors - Create vendor
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, rif, address, phone, email } = body

        if (!name || !rif) {
            return NextResponse.json(
                { error: 'Name and RIF required' },
                { status: 400 }
            )
        }

        // Check RIF unique
        const existing = await prisma.vendor.findFirst({
            where: {
                companyId: session.user.companyId,
                rif,
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Vendor with this RIF already exists' },
                { status: 409 }
            )
        }

        const vendor = await prisma.vendor.create({
            data: {
                companyId: session.user.companyId,
                name,
                rif,
                address,
                phone,
                email,
            },
        })

        return NextResponse.json({ success: true, vendor })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
