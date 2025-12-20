import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/store/products/[slug] - Product detail
export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        // Try to find by ID first, then by SKU
        let product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: params.slug },
                    { sku: params.slug },
                ],
                isActive: true,
            },
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

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Get related products (same category)
        const relatedProducts = await prisma.product.findMany({
            where: {
                category: product.category,
                id: { not: product.id },
                isActive: true,
                stock: { gt: 0 },
            },
            take: 4,
            select: {
                id: true,
                sku: true,
                name: true,
                priceUSD: true,
                priceBS: true,
                stock: true,
                image: true,
            },
        })

        return NextResponse.json({
            success: true,
            product,
            relatedProducts,
        })
    } catch (error) {
        console.error('Product detail error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
