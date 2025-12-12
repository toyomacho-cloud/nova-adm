import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema validation
const registerSchema = z.object({
    companyName: z.string().min(2),
    rif: z.string().min(6),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional()
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { companyName, rif, name, email, password, phone } = registerSchema.parse(body)

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: 'El correo electrónico ya está registrado' },
                { status: 400 }
            )
        }

        // Check if RIF already exists
        const existingCompany = await prisma.company.findUnique({
            where: { rif }
        })

        if (existingCompany) {
            return NextResponse.json(
                { message: 'El RIF de la empresa ya está registrado' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 10)

        // Create Company and Admin User transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Company
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    rif: rif,
                    phone: phone,
                    email: email
                }
            })

            // 2. Create User linked to Company
            const user = await tx.user.create({
                data: {
                    name: name,
                    email: email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: company.id
                }
            })

            // 3. Create default Payment Methods (Optional but good for UX)
            await tx.paymentMethod.createMany({
                data: [
                    { name: 'Efectivo Divisas', type: 'CASH', companyId: company.id },
                    { name: 'Efectivo Bolívares', type: 'CASH', companyId: company.id },
                    { name: 'Punto de Venta', type: 'DEBIT_CARD', companyId: company.id },
                    { name: 'Pago Móvil', type: 'MOBILE_PAYMENT', companyId: company.id }
                ]
            })

            return user
        })

        return NextResponse.json(
            { message: 'Empresa registrada exitosamente', userId: result.id },
            { status: 201 }
        )

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Datos inválidos', errors: error.errors },
                { status: 400 }
            )
        }

        console.error('Registration error:', error)
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
