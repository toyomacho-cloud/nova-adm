import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE /api/products/delete-all - Delete all products for company (ADMIN only)
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        // Only ADMIN can delete all products
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Solo administradores pueden eliminar el inventario' },
                { status: 403 }
            )
        }

        const companyId = session.user.companyId

        // Delete all products for this company
        const result = await prisma.product.deleteMany({
            where: { companyId }
        })

        return NextResponse.json({
            success: true,
            message: `Se eliminaron ${result.count} productos`,
            count: result.count
        })
    } catch (error) {
        console.error('Error deleting all products:', error)
        return NextResponse.json(
            { success: false, error: 'Error al eliminar productos' },
            { status: 500 }
        )
    }
}
