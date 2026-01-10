'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List inventory checks or get active check
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const companyId = session.user.companyId
        const { searchParams } = new URL(request.url)
        const active = searchParams.get('active')
        const limit = parseInt(searchParams.get('limit') || '20')

        if (active === 'true') {
            // Get active check (PENDING or IN_PROGRESS)
            const activeCheck = await prisma.inventoryCheck.findFirst({
                where: {
                    companyId,
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                    category: true,
                                    location: true,
                                    stock: true
                                }
                            }
                        },
                        orderBy: { id: 'asc' }
                    }
                }
            })

            return NextResponse.json({
                success: true,
                check: activeCheck
            })
        }

        // Get history
        const checks = await prisma.inventoryCheck.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json({
            success: true,
            checks
        })
    } catch (error) {
        console.error('Error fetching inventory checks:', error)
        return NextResponse.json(
            { success: false, error: 'Error al obtener verificaciones' },
            { status: 500 }
        )
    }
}

// POST - Create new random inventory check
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const companyId = session.user.companyId
        const userId = session.user.id

        const body = await request.json()
        const { itemCount = 10 } = body

        // Check if there's an active check
        const existingCheck = await prisma.inventoryCheck.findFirst({
            where: {
                companyId,
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        })

        if (existingCheck) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una verificación activa. Complétala primero.', checkId: existingCheck.id },
                { status: 400 }
            )
        }

        // Get random products (including those with 0 stock)
        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true
            },
            select: {
                id: true,
                stock: true
            }
        })

        if (products.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No hay productos para verificar' },
                { status: 400 }
            )
        }

        // Shuffle and take itemCount
        const shuffled = products.sort(() => Math.random() - 0.5)
        const selectedProducts = shuffled.slice(0, Math.min(itemCount, products.length))

        // Create check with items
        const check = await prisma.inventoryCheck.create({
            data: {
                companyId,
                userId,
                status: 'PENDING',
                totalItems: selectedProducts.length,
                items: {
                    create: selectedProducts.map((p: { id: string; stock: number | null }) => ({
                        productId: p.id,
                        expectedStock: p.stock || 0
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: true,
                                location: true,
                                stock: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            check,
            message: `Verificación creada con ${selectedProducts.length} productos`
        })
    } catch (error) {
        console.error('Error creating inventory check:', error)
        return NextResponse.json(
            { success: false, error: 'Error al crear verificación' },
            { status: 500 }
        )
    }
}
