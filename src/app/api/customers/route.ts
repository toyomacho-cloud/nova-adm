import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { Cargo } from '@/lib/cargos'
import { getNombreCargo } from '@/lib/cargos'

// Cargos permitidos para gestionar clientes
const CARGOS_GESTIONAR_CLIENTES: Cargo[] = ['PRESIDENTE', 'ADMINISTRADOR', 'VENDEDOR']

// GET /api/customers - List all customers
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''

        const customers = await prisma.customer.findMany({
            where: {
                companyId: session.user.companyId,
                OR: search ? [
                    { name: { contains: search } },
                    { rif: { contains: search } },
                    { email: { contains: search } },
                    { phone: { contains: search } },
                ] : undefined,
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({
            success: true,
            customers,
        })
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/customers - Create new customer
// @requerir_cargo([Cargo.PRESIDENTE, Cargo.ADMINISTRADOR, Cargo.VENDEDOR])
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verificar cargo para crear clientes
        const cargoUsuario = session.user.role as Cargo
        if (!CARGOS_GESTIONAR_CLIENTES.includes(cargoUsuario)) {
            const nombreCargo = getNombreCargo(cargoUsuario)
            return NextResponse.json(
                {
                    error: `Acceso denegado. Tu cargo de ${nombreCargo} no permite crear clientes.`,
                    cargoRequerido: CARGOS_GESTIONAR_CLIENTES.map(getNombreCargo).join(', '),
                },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { name, rif, address, phone, email, isSpecialTaxpayer } = body

        // Validation
        if (!name || !rif) {
            return NextResponse.json(
                { error: 'Name and RIF are required' },
                { status: 400 }
            )
        }

        // Check if RIF already exists
        const existing = await prisma.customer.findFirst({
            where: {
                companyId: session.user.companyId,
                rif,
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Customer with this RIF already exists' },
                { status: 409 }
            )
        }

        const customer = await prisma.customer.create({
            data: {
                companyId: session.user.companyId,
                name,
                rif,
                address: address || null,
                phone: phone || null,
                email: email || null,
                isSpecialTaxpayer: isSpecialTaxpayer || false,
            },
        })

        return NextResponse.json({
            success: true,
            customer,
        })
    } catch (error) {
        console.error('Error creating customer:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
