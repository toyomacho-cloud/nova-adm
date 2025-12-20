const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedPaymentMethods() {
    console.log('🌱 Creando métodos de pago...\n')

    try {
        // Obtener empresa (debe existir)
        const company = await prisma.company.findFirst()

        if (!company) {
            console.error('❌ No se encontró ninguna empresa. Ejecuta prisma/seed.js primero.')
            process.exit(1)
        }

        // Verificar si ya existen métodos
        const existing = await prisma.paymentMethod.count({
            where: { companyId: company.id }
        })

        if (existing > 0) {
            console.log(`ℹ️  Ya existen ${existing} métodos de pago`)
            console.log('   Eliminando métodos existentes...')
            await prisma.paymentMethod.deleteMany({
                where: { companyId: company.id }
            })
        }

        // Métodos USD (Moneda Extranjera)
        const usdMethods = [
            {
                name: 'Zelle',
                type: 'DIGITAL_TRANSFER',
                currency: 'USD',
                companyId: company.id
            },
            {
                name: 'USDT (TRC20)',
                type: 'CRYPTO',
                currency: 'USD',
                companyId: company.id
            },
            {
                name: 'PayPal',
                type: 'DIGITAL_TRANSFER',
                currency: 'USD',
                companyId: company.id
            },
            {
                name: 'Banesco Panamá',
                type: 'BANK_TRANSFER',
                currency: 'USD',
                companyId: company.id
            },
            {
                name: 'Dólares Efectivo',
                type: 'CASH',
                currency: 'USD',
                companyId: company.id
            }
        ]

        // Métodos Bs (Moneda Nacional)
        const bsMethods = [
            {
                name: 'Pago Móvil',
                type: 'MOBILE_PAYMENT',
                currency: 'BS',
                companyId: company.id
            },
            {
                name: 'Transferencia Bancaria',
                type: 'BANK_TRANSFER',
                currency: 'BS',
                companyId: company.id
            },
            {
                name: 'Punto de Venta',
                type: 'DEBIT_CARD',
                currency: 'BS',
                companyId: company.id
            },
            {
                name: 'Bolívares Efectivo',
                type: 'CASH',
                currency: 'BS',
                companyId: company.id
            }
        ]

        // Crear todos los métodos
        const allMethods = [...usdMethods, ...bsMethods]

        for (const method of allMethods) {
            await prisma.paymentMethod.create({ data: method })
        }

        console.log('✅ Métodos USD creados (5):')
        console.log('   💵 Zelle')
        console.log('   💵 USDT (TRC20)')
        console.log('   💵 PayPal')
        console.log('   💵 Banesco Panamá')
        console.log('   💵 Dólares Efectivo')
        console.log('')
        console.log('✅ Métodos Bs creados (4):')
        console.log('   💰 Pago Móvil')
        console.log('   💰 Transferencia Bancaria')
        console.log('   💰 Punto de Venta')
        console.log('   💰 Bolívares Efectivo')
        console.log('')
        console.log(`✨ Total: ${allMethods.length} métodos de pago creados\n`)

    } catch (error) {
        console.error('❌ Error creando métodos:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

seedPaymentMethods()
