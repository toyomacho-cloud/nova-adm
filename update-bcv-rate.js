const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateBCVRate() {
    console.log('📊 Actualizando tasa BCV a 2 decimales...\n')

    try {
        // Eliminar tasa anterior
        await prisma.exchangeRate.deleteMany({
            where: { currency: 'USD' }
        })

        // Crear tasa actualizada con 2 decimales
        const rate = await prisma.exchangeRate.create({
            data: {
                currency: 'USD',
                rate: 276.58, // Redondeado a 2 decimales
                source: 'BCV',
                date: new Date()
            }
        })

        console.log('✅ Tasa BCV actualizada exitosamente')
        console.log('💵 Nuevo valor: Bs.', rate.rate, '/ USD')
        console.log('📅 Fecha:', new Date().toLocaleDateString('es-VE'))
        console.log('\n🎯 Sistema listo para publicar\n')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateBCVRate()
