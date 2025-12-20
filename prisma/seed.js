const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed de datos...\n')

    try {
        // 1. Verificar si la empresa ya existe
        let company = await prisma.company.findUnique({
            where: { rif: 'J-29855293-5' }
        })

        if (!company) {
            // Crear empresa
            company = await prisma.company.create({
                data: {
                    name: 'TOYOMACHO C.A.',
                    rif: 'J-29855293-5',
                    phone: '04148972312',
                    email: 'admin@toyomacho.com',
                    address: 'Caracas, Venezuela'
                }
            })
            console.log('✅ Empresa creada:', company.name)
        } else {
            console.log('ℹ️  Empresa ya existe:', company.name)
        }

        // 2. Verificar si el usuario ya existe
        let user = await prisma.user.findUnique({
            where: { email: 'admin@toyomacho.com' }
        })

        if (!user) {
            // Hash password
            const hashedPassword = await bcrypt.hash('Poder.99', 10)

            // Crear usuario admin
            user = await prisma.user.create({
                data: {
                    name: 'Luis A Rivas',
                    email: 'admin@toyomacho.com',
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: company.id
                }
            })
            console.log('✅ Usuario admin creado:', user.email)
        } else {
            console.log('ℹ️  Usuario ya existe:', user.email)
        }

        // 3. Verificar métodos de pago
        const existingMethods = await prisma.paymentMethod.count({
            where: { companyId: company.id }
        })

        if (existingMethods === 0) {
            // Crear métodos de pago
            await prisma.paymentMethod.createMany({
                data: [
                    { name: 'Efectivo USD', type: 'CASH', companyId: company.id },
                    { name: 'Efectivo Bs', type: 'CASH', companyId: company.id },
                    { name: 'Punto de Venta', type: 'DEBIT_CARD', companyId: company.id },
                    { name: 'Pago Móvil', type: 'MOBILE_PAYMENT', companyId: company.id },
                    { name: 'Transferencia', type: 'BANK_TRANSFER', companyId: company.id }
                ]
            })
            console.log('✅ Métodos de pago creados: 5')
        } else {
            console.log(`ℹ️  Métodos de pago ya existen: ${existingMethods}`)
        }

        // 4. Crear tasa BCV inicial
        const existingRate = await prisma.exchangeRate.findFirst({
            where: {
                currency: 'USD',
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        })

        if (!existingRate) {
            await prisma.exchangeRate.create({
                data: {
                    currency: 'USD',
                    rate: 276.57, // Tasa oficial BCV 17 dic 2025
                    source: 'BCV',
                    date: new Date()
                }
            })
            console.log('✅ Tasa BCV inicial creada: 276.57 Bs/USD (actualizada)')
        } else {
            console.log(`ℹ️  Tasa BCV ya existe: ${existingRate.rate} Bs/USD`)
        }

        console.log('\n✨ Seed completado exitosamente!\n')
        console.log('📧 Email: admin@toyomacho.com')
        console.log('🔒 Password: Poder.99\n')

    } catch (error) {
        console.error('❌ Error en seed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
