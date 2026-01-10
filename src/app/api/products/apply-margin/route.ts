import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/products/apply-margin - Apply profit margin to all products (ADMIN only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        // Only ADMIN can apply profit margin
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Solo administradores pueden modificar el margen de ganancia' },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { percentage } = body

        if (typeof percentage !== 'number' || percentage < 0 || percentage > 1000) {
            return NextResponse.json(
                { success: false, error: 'Porcentaje debe ser un número entre 0 y 1000' },
                { status: 400 }
            )
        }

        const companyId = session.user.companyId

        // Get all products
        const products = await prisma.product.findMany({
            where: { companyId, isActive: true }
        })

        // Calculate multiplier: 300 input = cost × 3, 150 input = cost × 1.5
        const multiplier = percentage / 100

        // Update each product's priceUSD based on costUSD * multiplier
        let updated = 0
        for (const product of products) {
            const newPriceUSD = (product.costUSD || 0) * multiplier

            await prisma.product.update({
                where: { id: product.id },
                data: {
                    priceUSD: newPriceUSD,
                    // Update priceBS based on latest exchange rate if available
                }
            })
            updated++
        }

        return NextResponse.json({
            success: true,
            message: `Multiplicador ×${(percentage / 100).toFixed(2)} aplicado a ${updated} productos`,
            updated,
            percentage
        })
    } catch (error) {
        console.error('Error applying profit margin:', error)
        return NextResponse.json(
            { success: false, error: 'Error al aplicar margen' },
            { status: 500 }
        )
    }
}
