import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/products - List all products
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''

        const products = await prisma.product.findMany({
            where: {
                companyId: session.user.companyId,
                isActive: true,
                AND: [
                    search ? {
                        OR: [
                            { name: { contains: search } },
                            { sku: { contains: search } },
                            { description: { contains: search } },
                        ],
                    } : {},
                    category ? { category } : {},
                ],
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({
            success: true,
            products,
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/products - Create new product
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { sku, name, description, category, priceUSD, costUSD, stock, minStock, reference, brand, location } = body

        // Use description or reference as name if name not provided
        const productName = name || description || reference || 'Sin nombre'

        // Validation - only SKU is truly required now
        if (!sku) {
            return NextResponse.json(
                { error: 'SKU es requerido' },
                { status: 400 }
            )
        }

        // Check if SKU already exists
        const existing = await prisma.product.findFirst({
            where: {
                companyId: session.user.companyId,
                sku,
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Ya existe un producto con este SKU' },
                { status: 409 }
            )
        }

        // Get current BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })

        const rate = bcvRate?.rate || 36.5
        const price = priceUSD ? parseFloat(priceUSD) : 0
        const priceBS = price * rate
        const costBS = costUSD ? parseFloat(costUSD) * rate : 0

        const product = await prisma.product.create({
            data: {
                companyId: session.user.companyId,
                sku,
                name: productName,
                description: description || null,
                category: category || null,
                priceUSD: price,
                priceBS,
                costUSD: costUSD ? parseFloat(costUSD) : 0,
                costBS,
                stock: stock ? parseInt(stock) : 0,
                minStock: minStock ? parseInt(minStock) : 5,
                // Note: brand, reference, location not in Product model yet
                // They would need to be added to schema if needed
            },
        })

        return NextResponse.json({
            success: true,
            product,
        })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
