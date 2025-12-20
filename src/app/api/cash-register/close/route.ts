import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { cashRegisterId, closingBalanceUSD, closingBalanceBS, notes } = body

        // Verificar que la caja existe y está abierta
        const cashRegister = await prisma.cashRegister.findUnique({
            where: { id: cashRegisterId },
            include: {
                transactions: {
                    include: {
                        paymentMethod: true
                    }
                }
            }
        })

        if (!cashRegister || cashRegister.closedAt) {
            return NextResponse.json({
                error: 'Caja no encontrada o ya cerrada'
            }, { status: 400 })
        }

        // Calcular balances esperados por moneda
        let expectedUSD = cashRegister.openingBalanceUSD
        let expectedBS = cashRegister.openingBalanceBS

        cashRegister.transactions.forEach((t: any) => {
            const isIncome = ['CASH_IN', 'SALE'].includes(t.type)
            const currency = t.paymentMethod?.currency || 'USD'

            if (currency === 'USD') {
                expectedUSD += isIncome ? t.amount : -t.amount
            } else {
                expectedBS += isIncome ? t.amount : -t.amount
            }
        })

        const differenceUSD = closingBalanceUSD - expectedUSD
        const differenceBS = closingBalanceBS - expectedBS

        // Cerrar caja
        const updatedCashRegister = await prisma.cashRegister.update({
            where: { id: cashRegisterId },
            data: {
                closedAt: new Date(),
                closingBalanceUSD,
                closingBalanceBS,
                expectedBalanceUSD: expectedUSD,
                expectedBalanceBS: expectedBS,
                differenceUSD,
                differenceBS,
                notes
            }
        })

        return NextResponse.json({
            success: true,
            cashRegister: updatedCashRegister,
            summary: {
                USD: {
                    opening: cashRegister.openingBalanceUSD,
                    expected: expectedUSD,
                    closing: closingBalanceUSD,
                    difference: differenceUSD
                },
                BS: {
                    opening: cashRegister.openingBalanceBS,
                    expected: expectedBS,
                    closing: closingBalanceBS,
                    difference: differenceBS
                },
                bcvRate: cashRegister.bcvRate
            }
        })

    } catch (error) {
        console.error('Error closing cash register:', error)
        return NextResponse.json({
            error: 'Error al cerrar caja'
        }, { status: 500 })
    }
}
