import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/store/products - Public catalog
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''
        const minPrice = parseFloat(searchParams.get('minPrice') || '0')
        const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
        const sort = searchParams.get('sort') || 'name'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')

        const where: any = {
            isActive: true,
            stock: { gt: 0 }, // Only show products in stock
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (category) {
            where.category = category
        }

        where.priceUSD = {
            gte: minPrice,
            lte: maxPrice,
        }

        // Count total
        const total = await prisma.product.count({ where })

        // Get products
        const orderBy: any = {}
        switch (sort) {
            case 'price-asc':
                orderBy.priceUSD = 'asc'
                break
            case 'price-desc':
                orderBy.priceUSD = 'desc'
                break
            case 'newest':
                orderBy.createdAt = 'desc'
                break
            default:
                orderBy.name = 'asc'
        }

        const products = await prisma.product.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                category: true,
                priceUSD: true,
                priceBS: true,
                stock: true,
                minStock: true,
                image: true,
                createdAt: true,
            },
        })

        // Get categories for filters
        const categories = await prisma.product.groupBy({
            by: ['category'],
            where: { isActive: true },
            _count: true,
        })

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            filters: {
                categories: categories.map((c) => ({
                    name: c.category,
                    count: c._count,
                })),
            },
        })
    } catch (error) {
        console.error('Store catalog error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
