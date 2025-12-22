import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Map to store category codes
const getCategoryCode = async (companyId: string, categoryName: string): Promise<string> => {
    // Normalize category name
    const normalizedCategory = categoryName.trim().toUpperCase()

    // Check if this category already has products
    const existingProduct = await prisma.product.findFirst({
        where: {
            companyId,
            category: {
                equals: categoryName,
                mode: 'insensitive'
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    if (existingProduct && existingProduct.sku) {
        // Extract category code from existing SKU
        const parts = existingProduct.sku.split('-')
        if (parts.length >= 2 && /^\d{3}$/.test(parts[1])) {
            return parts[1]
        }
    }

    // Get all unique category codes used
    const products = await prisma.product.findMany({
        where: { companyId },
        select: { sku: true, category: true }
    })

    const usedCategoryCodes = new Set<string>()
    products.forEach((p: { sku: string | null; category: string | null }) => {
        if (p.sku) {
            const parts = p.sku.split('-')
            if (parts.length >= 2 && /^\d{3}$/.test(parts[1])) {
                usedCategoryCodes.add(parts[1])
            }
        }
    })

    // Find next available code
    for (let i = 1; i <= 999; i++) {
        const code = i.toString().padStart(3, '0')
        if (!usedCategoryCodes.has(code)) {
            return code
        }
    }

    return '999' // Fallback
}

const getNextSeriesNumber = async (companyId: string, brandPrefix: string, categoryCode: string): Promise<string> => {
    // Find all products with same brand prefix and category code
    const pattern = `${brandPrefix}-${categoryCode}-%`

    const products = await prisma.product.findMany({
        where: {
            companyId,
            sku: {
                startsWith: `${brandPrefix}-${categoryCode}-`
            }
        },
        select: { sku: true }
    })

    let maxSeries = 0
    products.forEach((p: { sku: string }) => {
        if (p.sku) {
            const parts = p.sku.split('-')
            if (parts.length >= 3) {
                const series = parseInt(parts[2], 10)
                if (!isNaN(series) && series > maxSeries) {
                    maxSeries = series
                }
            }
        }
    })

    return (maxSeries + 1).toString().padStart(3, '0')
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { brand, category } = body

        if (!brand || !category) {
            return NextResponse.json(
                { success: false, error: 'Marca y categoría son requeridos' },
                { status: 400 }
            )
        }

        // Get company
        const company = await prisma.company.findFirst()
        if (!company) {
            return NextResponse.json(
                { success: false, error: 'No hay empresa configurada' },
                { status: 400 }
            )
        }

        // Generate brand prefix (first 3 letters, uppercase)
        const brandPrefix = brand.trim().substring(0, 3).toUpperCase()

        // Get category code
        const categoryCode = await getCategoryCode(company.id, category)

        // Get next series number
        const seriesNumber = await getNextSeriesNumber(company.id, brandPrefix, categoryCode)

        const sku = `${brandPrefix}-${categoryCode}-${seriesNumber}`

        return NextResponse.json({
            success: true,
            sku,
            brandPrefix,
            categoryCode,
            seriesNumber
        })

    } catch (error) {
        console.error('Error generating SKU:', error)
        return NextResponse.json(
            { success: false, error: 'Error al generar SKU' },
            { status: 500 }
        )
    }
}
