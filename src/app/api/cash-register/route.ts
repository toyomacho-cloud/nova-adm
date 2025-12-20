import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Abrir caja con dual currency
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { openingBalanceUSD, openingBalanceBS } = await request.json()

        // Verificar que no haya caja abierta
        const existingCashRegister = await prisma.cashRegister.findFirst({
            where: {
                companyId: session.user.companyId,
                closedAt: null
            }
        })

        if (existingCashRegister) {
            return NextResponse.json({
                error: 'Ya existe una caja abierta'
            }, { status: 400 })
        }

        // Obtener tasa BCV actual
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' }
        })

        if (!bcvRate) {
            return NextResponse.json({
                error: 'No se encontró la tasa BCV'
            }, { status: 400 })
        }

        // Crear nueva caja
        const cashRegister = await prisma.cashRegister.create({
            data: {
                companyId: session.user.companyId,
                userId: session.user.id,
                openingBalanceUSD: openingBalanceUSD || 0,
                openingBalanceBS: openingBalanceBS || 0,
                expectedBalanceUSD: openingBalanceUSD || 0,
                expectedBalanceBS: openingBalanceBS || 0,
                bcvRate: bcvRate.rate
            }
        })

        return NextResponse.json({
            success: true,
            cashRegister,
            bcvRate: bcvRate.rate
        })

    } catch (error) {
        console.error('Error opening cash register:', error)
        return NextResponse.json({
            error: 'Error al abrir caja'
        }, { status: 500 })
    }
}

// GET - Obtener caja activa
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const cashRegister = await prisma.cashRegister.findFirst({
            where: {
                companyId: session.user.companyId,
                closedAt: null
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            cashRegister
        })

    } catch (error) {
        console.error('Error getting cash register:', error)
        return NextResponse.json({
            error: 'Error al obtener caja'
        }, { status: 500 })
    }
}
