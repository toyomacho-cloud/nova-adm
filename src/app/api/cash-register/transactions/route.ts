import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar transacciones
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const cashRegisterId = searchParams.get('cashRegisterId')

        if (!cashRegisterId) {
            return NextResponse.json({
                error: 'cashRegisterId requerido'
            }, { status: 400 })
        }

        const transactions = await prisma.cashTransaction.findMany({
            where: { cashRegisterId },
            include: {
                paymentMethod: true
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calcular totales por moneda
        const totals = transactions.reduce((acc: Record<string, number>, t: any) => {
            const isIncome = ['CASH_IN', 'SALE'].includes(t.type)
            const currency = t.paymentMethod?.currency || 'USD'

            if (!acc[currency]) acc[currency] = 0

            if (isIncome) {
                acc[currency] += t.amount
            } else {
                acc[currency] -= t.amount
            }

            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            success: true,
            transactions,
            totals
        })

    } catch (error) {
        console.error('Error getting transactions:', error)
        return NextResponse.json({
            error: 'Error al obtener transacciones'
        }, { status: 500 })
    }
}

// POST - Crear transacción
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            cashRegisterId,
            type,
            amount,
            description,
            paymentMethodId,
            reference
        } = body

        // Obtener método de pago para saber la moneda
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: paymentMethodId }
        })

        if (!paymentMethod) {
            return NextResponse.json({
                error: 'Método de pago no encontrado'
            }, { status: 400 })
        }

        // Crear transacción
        const transaction = await prisma.cashTransaction.create({
            data: {
                cashRegisterId,
                companyId: session.user.companyId,
                userId: session.user.id,
                type,
                amount,
                description,
                paymentMethodId,
                reference
            },
            include: {
                paymentMethod: true
            }
        })

        return NextResponse.json({
            success: true,
            transaction
        })

    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json({
            error: 'Error al crear transacción'
        }, { status: 500 })
    }
}
