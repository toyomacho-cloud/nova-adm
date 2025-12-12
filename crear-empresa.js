const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('Poder.99', 10)

        // Create Company and Admin User
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Company
            const company = await tx.company.create({
                data: {
                    name: 'TOYOMACHO C.A.',
                    rif: 'J-29855293-5',
                    phone: '04148972312',
                    email: 'luisar2ro@gmail.com'
                }
            })

            console.log('✅ Empresa creada:', company.name)

            // 2. Create User
            const user = await tx.user.create({
                data: {
                    name: 'LUIS A RIVAS',
                    email: 'luisar2ro@gmail.com',
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: company.id
                }
            })

            console.log('✅ Usuario administrador creado:', user.name)

            // 3. Create default payment methods
            await tx.paymentMethod.createMany({
                data: [
                    { name: 'Efectivo Divisas', type: 'CASH', companyId: company.id },
                    { name: 'Efectivo Bolívares', type: 'CASH', companyId: company.id },
                    { name: 'Punto de Venta', type: 'DEBIT_CARD', companyId: company.id },
                    { name: 'Pago Móvil', type: 'MOBILE_PAYMENT', companyId: company.id }
                ]
            })

            console.log('✅ Métodos de pago creados')

            return user
        })

        console.log('\n🎉 ¡REGISTRO EXITOSO!')
        console.log('Email:', 'luisar2ro@gmail.com')
        console.log('Contraseña:', 'Poder.99')
        console.log('\nYa puedes iniciar sesión en: https://nova-adm.vercel.app/auth/login')

    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
