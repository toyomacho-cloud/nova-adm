import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/products - List all products with pagination
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''

        // OPTIMIZED: Pagination support for large catalogs
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '100') // Default 100, was unlimited
        const skip = (page - 1) * limit

        // Build where clause once for reuse
        const whereClause = {
            companyId: session.user.companyId,
            isActive: true,
            AND: [
                search ? {
                    OR: [
                        { reference: { contains: search, mode: 'insensitive' as const } },
                        { description: { contains: search, mode: 'insensitive' as const } },
                        { sku: { contains: search, mode: 'insensitive' as const } },
                        { location: { contains: search, mode: 'insensitive' as const } },
                        { name: { contains: search, mode: 'insensitive' as const } },
                    ],
                } : {},
                category ? { category } : {},
            ],
        }

        // OPTIMIZED: Parallel count and fetch for pagination metadata
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                orderBy: [
                    { reference: 'asc' },
                    { name: 'asc' },
                ],
                skip,
                take: limit,
                // OPTIMIZED: Select only needed fields for listing
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    reference: true,
                    description: true,
                    category: true,
                    brand: true,
                    location: true,
                    image: true,
                    priceUSD: true,
                    priceBS: true,
                    costUSD: true,
                    stock: true,
                    minStock: true,
                    isActive: true,
                },
            }),
            prisma.product.count({ where: whereClause }),
        ])

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + products.length < total,
            },
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
        const { sku, name, description, category, priceUSD, costUSD, stock, minStock, reference, brand, location, imageUrl } = body

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
                reference: reference || null,
                brand: brand || null,
                location: location || null,
                image: imageUrl || null,  // Save imageUrl as image
                priceUSD: price,
                priceBS,
                costUSD: costUSD ? parseFloat(costUSD) : 0,
                costBS,
                stock: stock ? parseInt(stock) : 0,
                minStock: minStock ? parseInt(minStock) : 5,
            },
        })

        return NextResponse.json({
            success: true,
            product,
        })
    } catch (error: any) {
        console.error('Error creating product:', error)
        console.error('Error message:', error?.message)
        console.error('Error stack:', error?.stack)
        return NextResponse.json({
            error: 'Internal server error',
            details: error?.message || 'Unknown error'
        }, { status: 500 })
    }
}
