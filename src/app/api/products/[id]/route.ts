import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/products/:id - Get single product
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const product = await prisma.product.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            product,
        })
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/products/:id - Update product
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
        const { sku, name, description, category, priceUSD, costUSD, stock, minStock, isActive } = body

        // Verify ownership
        const existing = await prisma.product.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Get current BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })

        const rate = bcvRate?.rate || 36.5

        const updateData: any = {}

        if (sku !== undefined) updateData.sku = sku
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (category !== undefined) updateData.category = category
        if (isActive !== undefined) updateData.isActive = isActive
        if (stock !== undefined) updateData.stock = parseInt(stock)
        if (minStock !== undefined) updateData.minStock = parseInt(minStock)

        if (priceUSD !== undefined) {
            updateData.priceUSD = parseFloat(priceUSD)
            updateData.priceBS = parseFloat(priceUSD) * rate
        }

        if (costUSD !== undefined) {
            updateData.costUSD = parseFloat(costUSD)
            updateData.costBS = parseFloat(costUSD) * rate
        }

        const product = await prisma.product.update({
            where: { id: params.id },
            data: updateData,
        })

        return NextResponse.json({
            success: true,
            product,
        })
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/products/:id - Delete product
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
        const existing = await prisma.product.findFirst({
            where: {
                id: params.id,
                companyId: session.user.companyId,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Soft delete (mark as inactive)
        await prisma.product.update({
            where: { id: params.id },
            data: { isActive: false },
        })

        return NextResponse.json({
            success: true,
            message: 'Product deactivated successfully',
        })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
