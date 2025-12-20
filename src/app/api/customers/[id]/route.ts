import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/customers/:id - Get single customer
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
            include: {
                sales: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            customer,
        })
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/customers/:id - Update customer
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, rif, address, phone, email, isSpecialTaxpayer } = body

        // Verify ownership
        const existing = await prisma.customer.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        const customer = await prisma.customer.update({
            where: { id: params.id },
            data: {
                name: name || existing.name,
                rif: rif || existing.rif,
                address: address !== undefined ? address : existing.address,
                phone: phone !== undefined ? phone : existing.phone,
                email: email !== undefined ? email : existing.email,
                isSpecialTaxpayer: isSpecialTaxpayer !== undefined ? isSpecialTaxpayer : existing.isSpecialTaxpayer,
            },
        })

        return NextResponse.json({
            success: true,
            customer,
        })
    } catch (error) {
        console.error('Error updating customer:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/customers/:id - Delete customer
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify ownership
        const existing = await prisma.customer.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Check if customer has sales
        const salesCount = await prisma.sale.count({
            where: { customerId: params.id },
        })

        if (salesCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete customer with existing sales' },
                { status: 400 }
            )
        }

        await prisma.customer.delete({
            where: { id: params.id },
        })

        return NextResponse.json({
            success: true,
            message: 'Customer deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
