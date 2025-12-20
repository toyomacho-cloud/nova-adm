import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar métodos de pago
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const currency = searchParams.get('currency') // USD, BS, o null para todos

        const where: any = {
            companyId: session.user.companyId
        }

        if (currency) {
            where.currency = currency
        }

        const methods = await prisma.paymentMethod.findMany({
            where,
            orderBy: [
                { currency: 'asc' }, // USD primero, luego BS
                { type: 'asc' }
            ]
        })

        // Agrupar por moneda
        const grouped = {
            USD: methods.filter(m => m.currency === 'USD'),
            BS: methods.filter(m => m.currency === 'BS')
        }

        return NextResponse.json({
            success: true,
            methods,
            grouped
        })

    } catch (error) {
        console.error('Error getting payment methods:', error)
        return NextResponse.json({
            error: 'Error al obtener métodos de pago'
        }, { status: 500 })
    }
}

// PATCH - Actualizar método (activar/desactivar)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id, isActive } = await request.json()

        const method = await prisma.paymentMethod.update({
            where: { id },
            data: { isActive }
        })

        return NextResponse.json({
            success: true,
            method
        })

    } catch (error) {
        console.error('Error updating payment method:', error)
        return NextResponse.json({
            error: 'Error al actualizar método'
        }, { status: 500 })
    }
}
