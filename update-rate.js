const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateRate() {
    console.log('Actualizando tasa BCV a 276.57...')

    // Eliminar tasas antiguas
    await prisma.exchangeRate.deleteMany({
        where: { currency: 'USD' }
    })

    // Crear tasa actualizada
    await prisma.exchangeRate.create({
        data: {
            currency: 'USD',
            rate: 276.57,
            source: 'BCV',
            date: new Date()
        }
    })

    console.log('✅ Tasa actualizada: 276.57 Bs/USD')
    await prisma.$disconnect()
}

updateRate()
