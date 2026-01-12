import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import type { Cargo } from '@/lib/cargos'
import { getNombreCargo } from '@/lib/cargos'

// Solo PRESIDENTE puede gestionar usuarios
const CARGOS_GESTIONAR_USUARIOS: Cargo[] = ['PRESIDENTE']

// GET /api/users - List all users
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            where: { companyId: session.user.companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ success: true, users })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/users - Create new user
// @requerir_cargo([Cargo.PRESIDENTE])
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verificar cargo
        const cargoUsuario = session.user.role as Cargo
        if (!CARGOS_GESTIONAR_USUARIOS.includes(cargoUsuario)) {
            return NextResponse.json(
                { error: `Solo el Presidente puede crear usuarios.` },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { name, email, password, role } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Nombre, email y contraseña son requeridos' },
                { status: 400 }
            )
        }

        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con este email' },
                { status: 409 }
            )
        }

        const hashedPassword = await hash(password, 12)

        const user = await prisma.user.create({
            data: {
                companyId: session.user.companyId,
                name,
                email,
                password: hashedPassword,
                role: role || 'VENDEDOR',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        })

        return NextResponse.json({ success: true, user })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/users - Delete user (soft delete)
// @requerir_cargo([Cargo.PRESIDENTE])
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verificar cargo
        const cargoUsuario = session.user.role as Cargo
        if (!CARGOS_GESTIONAR_USUARIOS.includes(cargoUsuario)) {
            return NextResponse.json(
                { error: `Solo el Presidente puede eliminar usuarios.` },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('id')

        if (!userId) {
            return NextResponse.json(
                { error: 'ID de usuario requerido' },
                { status: 400 }
            )
        }

        // Cannot delete yourself
        if (userId === session.user.id) {
            return NextResponse.json(
                { error: 'No puedes eliminar tu propio usuario' },
                { status: 400 }
            )
        }

        // Verify user belongs to company
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                companyId: session.user.companyId,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        // Soft delete - mark as inactive
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        })

        return NextResponse.json({
            success: true,
            message: 'Usuario eliminado correctamente',
        })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
