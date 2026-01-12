'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { Cargo } from '@/lib/cargos'
import { getNombreCargo } from '@/lib/cargos'

// Cargos permitidos para ajustar stock (equivalente a @requerir_cargo)
const CARGOS_AJUSTAR_STOCK: Cargo[] = ['PRESIDENTE', 'ADMINISTRADOR', 'ALMACENISTA']

const DEMO_COMPANY_ID = 'demo-company-id'
const DEMO_USER_ID = 'demo-user-id'

// GET - List inventory movements
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: any = {
            companyId: DEMO_COMPANY_ID
        }

        if (productId) {
            where.productId = productId
        }

        if (type) {
            where.type = type
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate)
            }
        }

        const movements = await prisma.inventoryMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        category: true,
                        location: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        // Get stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [todayEntries, todayExits, totalMovements] = await Promise.all([
            prisma.inventoryMovement.count({
                where: {
                    companyId: DEMO_COMPANY_ID,
                    type: 'ENTRY',
                    createdAt: { gte: today }
                }
            }),
            prisma.inventoryMovement.count({
                where: {
                    companyId: DEMO_COMPANY_ID,
                    type: 'EXIT',
                    createdAt: { gte: today }
                }
            }),
            prisma.inventoryMovement.count({
                where: { companyId: DEMO_COMPANY_ID }
            })
        ])

        return NextResponse.json({
            success: true,
            movements,
            stats: {
                todayEntries,
                todayExits,
                totalMovements
            }
        })
    } catch (error) {
        console.error('Error fetching inventory movements:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener movimientos' },
            { status: 500 }
        )
    }
}

// POST - Create inventory movement
// @requerir_cargo([Cargo.PRESIDENTE, Cargo.ADMINISTRADOR, Cargo.ALMACENISTA])
export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación y cargo
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado. Por favor inicia sesión.' },
                { status: 401 }
            )
        }

        const cargoUsuario = session.user.role as Cargo

        // Verificar si el cargo tiene permiso para ajustar stock
        if (!CARGOS_AJUSTAR_STOCK.includes(cargoUsuario)) {
            const nombreCargo = getNombreCargo(cargoUsuario)
            return NextResponse.json(
                {
                    success: false,
                    error: `Acceso denegado. Tu cargo de ${nombreCargo} no permite ajustar el stock.`,
                    cargoRequerido: CARGOS_AJUSTAR_STOCK.map(getNombreCargo).join(', '),
                    cargoActual: nombreCargo,
                },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { productId, type, quantity, reason, reference, notes } = body

        // Validate required fields
        if (!productId || !type || !quantity) {
            return NextResponse.json(
                { success: false, error: 'Producto, tipo y cantidad son requeridos' },
                { status: 400 }
            )
        }

        if (!['ENTRY', 'EXIT', 'ADJUSTMENT'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Tipo de movimiento inválido' },
                { status: 400 }
            )
        }

        const qty = parseInt(quantity)
        if (isNaN(qty) || qty <= 0) {
            return NextResponse.json(
                { success: false, error: 'Cantidad debe ser un número positivo' },
                { status: 400 }
            )
        }

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            )
        }

        const previousStock = product.stock
        let newStock: number

        if (type === 'ENTRY') {
            newStock = previousStock + qty
        } else if (type === 'EXIT') {
            if (previousStock < qty) {
                return NextResponse.json(
                    { success: false, error: `Stock insuficiente. Stock actual: ${previousStock}` },
                    { status: 400 }
                )
            }
            newStock = previousStock - qty
        } else {
            // ADJUSTMENT - set to exact quantity
            newStock = qty
        }

        // Create movement and update product stock in transaction
        const [movement] = await prisma.$transaction([
            prisma.inventoryMovement.create({
                data: {
                    companyId: DEMO_COMPANY_ID,
                    productId,
                    type,
                    quantity: qty,
                    previousStock,
                    newStock,
                    reason,
                    reference,
                    notes,
                    userId: DEMO_USER_ID
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.product.update({
                where: { id: productId },
                data: { stock: newStock }
            })
        ])

        return NextResponse.json({
            success: true,
            movement,
            message: `Stock actualizado: ${previousStock} → ${newStock}`
        })
    } catch (error) {
        console.error('Error creating inventory movement:', error)
        return NextResponse.json(
            { success: false, error: 'Error al crear movimiento' },
            { status: 500 }
        )
    }
}
