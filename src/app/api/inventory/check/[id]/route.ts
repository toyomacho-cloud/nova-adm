'use server'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH - Update check item (report actual stock) or complete check
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { action, itemId, actualStock, notes } = body

        // Get the check
        const check = await prisma.inventoryCheck.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!check) {
            return NextResponse.json(
                { success: false, error: 'Verificación no encontrada' },
                { status: 404 }
            )
        }

        // Complete the check
        if (action === 'complete') {
            const completedCheck = await prisma.inventoryCheck.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                check: completedCheck
            })
        }

        // Update a specific item
        if (!itemId || actualStock === undefined) {
            return NextResponse.json(
                { success: false, error: 'itemId y actualStock son requeridos' },
                { status: 400 }
            )
        }

        // Find the item
        const item = check.items.find((i: { id: string }) => i.id === itemId)
        if (!item) {
            return NextResponse.json(
                { success: false, error: 'Item no encontrado' },
                { status: 404 }
            )
        }

        const actualQty = parseInt(actualStock)
        const isMatch = actualQty === item.expectedStock

        // Update item
        await prisma.inventoryCheckItem.update({
            where: { id: itemId },
            data: {
                actualStock: actualQty,
                isMatch,
                notes,
                checkedAt: new Date()
            }
        })

        // Recalculate check stats
        const updatedItems = await prisma.inventoryCheckItem.findMany({
            where: { checkId: id }
        })

        const checkedItems = updatedItems.filter((i: { actualStock: number | null }) => i.actualStock !== null).length
        const matchedItems = updatedItems.filter((i: { isMatch: boolean | null }) => i.isMatch === true).length
        const discrepancies = updatedItems.filter((i: { isMatch: boolean | null }) => i.isMatch === false).length

        // Update check
        const updatedCheck = await prisma.inventoryCheck.update({
            where: { id },
            data: {
                status: checkedItems > 0 ? 'IN_PROGRESS' : 'PENDING',
                checkedItems,
                matchedItems,
                discrepancies,
                startedAt: check.startedAt || new Date()
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
            check: updatedCheck,
            isMatch,
            message: isMatch ? '✓ Stock coincide' : '⚠ Diferencia detectada'
        })
    } catch (error) {
        console.error('Error updating inventory check:', error)
        return NextResponse.json(
            { success: false, error: 'Error al actualizar verificación' },
            { status: 500 }
        )
    }
}

// DELETE - Cancel/delete a check
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.inventoryCheck.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Verificación cancelada'
        })
    } catch (error) {
        console.error('Error deleting inventory check:', error)
        return NextResponse.json(
            { success: false, error: 'Error al cancelar verificación' },
            { status: 500 }
        )
    }
}
