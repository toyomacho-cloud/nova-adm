import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/purchases - List purchases
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const purchases = await prisma.purchase.findMany({
            where: { companyId: session.user.companyId },
            include: {
                vendor: true,
                items: true,
            },
            orderBy: { invoiceDate: 'desc' },
        })

        return NextResponse.json({ success: true, purchases })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/purchases - Create purchase
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { vendorId, invoiceNumber, items, notes } = body

        if (!vendorId || !invoiceNumber || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Vendor, invoice number, and items required' },
                { status: 400 }
            )
        }

        // Check invoice unique for vendor
        const existing = await prisma.purchase.findFirst({
            where: {
                companyId: session.user.companyId,
                vendorId,
                invoiceNumber,
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Purchase with this invoice number already exists' },
                { status: 409 }
            )
        }

        // Calculate totals
        let subtotal = 0
        const validatedItems = []

        for (const item of items) {
            const itemSubtotal = item.unitPrice * item.quantity
            subtotal += itemSubtotal

            validatedItems.push({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: itemSubtotal,
                taxAmount: itemSubtotal * 0.16,
                total: itemSubtotal * 1.16,
                productId: item.productId || null,
            })
        }

        const taxAmount = subtotal * 0.16
        const total = subtotal + taxAmount

        // Create purchase
        const purchase = await prisma.purchase.create({
            data: {
                companyId: session.user.companyId,
                vendorId,
                userId: session.user.id,
                invoiceNumber,
                invoiceDate: new Date(),
                subtotal,
                taxAmount,
                taxRate: 16.0,
                total,
                status: 'PENDING',
                notes,
                items: {
                    create: validatedItems,
                },
            },
            include: {
                vendor: true,
                items: true,
            },
        })

        // Update product stock if productId provided
        for (const item of items) {
            if (item.productId) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                })
            }
        }

        return NextResponse.json({ success: true, purchase })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
