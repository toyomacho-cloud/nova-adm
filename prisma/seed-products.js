const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedProducts() {
    console.log('🌱 Seeding products...')

    try {
        // Get first company
        const company = await prisma.company.findFirst()

        if (!company) {
            console.error('❌ No company found. Run main seed first.')
            return
        }

        // Get BCV rate
        const bcvRate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' },
        })

        const rate = bcvRate?.rate || 276.58

        const products = [
            {
                sku: 'PROD-001',
                name: 'Laptop HP 14"',
                description: 'Laptop HP 14 pulgadas, Intel Core i5, 8GB RAM, 256GB SSD',
                category: 'Electrónicos',
                priceUSD: 450.00,
                costUSD: 350.00,
                stock: 15,
                minStock: 5,
            },
            {
                sku: 'PROD-002',
                name: 'Mouse Logitech M185',
                description: 'Mouse inalámbrico Logitech M185',
                category: 'Electrónicos',
                priceUSD: 12.00,
                costUSD: 8.00,
                stock: 50,
                minStock: 10,
            },
            {
                sku: 'PROD-003',
                name: 'Teclado Mecánico',
                description: 'Teclado mecánico retroiluminado RGB',
                category: 'Electrónicos',
                priceUSD: 65.00,
                costUSD: 45.00,
                stock: 8,
                minStock: 5,
            },
            {
                sku: 'PROD-004',
                name: 'Monitor LG 24"',
                description: 'Monitor LG 24 pulgadas Full HD',
                category: 'Electrónicos',
                priceUSD: 180.00,
                costUSD: 140.00,
                stock: 3,
                minStock: 5,
            },
            {
                sku: 'PROD-005',
                name: 'Auriculares Sony',
                description: 'Auriculares Sony con cancelación de ruido',
                category: 'Electrónicos',
                priceUSD: 85.00,
                costUSD: 60.00,
                stock: 20,
                minStock: 8,
            },
            {
                sku: 'PROD-006',
                name: 'USB 32GB',
                description: 'Memoria USB 32GB Kingston',
                category: 'Accesorios',
                priceUSD: 8.00,
                costUSD: 5.00,
                stock: 100,
                minStock: 20,
            },
            {
                sku: 'PROD-007',
                name: 'Cable HDMI 2m',
                description: 'Cable HDMI 2 metros alta velocidad',
                category: 'Accesorios',
                priceUSD: 6.00,
                costUSD: 3.50,
                stock: 45,
                minStock: 15,
            },
            {
                sku: 'PROD-008',
                name: 'Webcam Logitech C920',
                description: 'Webcam Full HD 1080p',
                category: 'Electrónicos',
                priceUSD: 75.00,
                costUSD: 55.00,
                stock: 0,
                minStock: 5,
            },
            {
                sku: 'PROD-009',
                name: 'Silla Gamer',
                description: 'Silla ergonómica para gaming',
                category: 'Muebles',
                priceUSD: 220.00,
                costUSD: 160.00,
                stock: 5,
                minStock: 3,
            },
            {
                sku: 'PROD-010',
                name: 'Soporte para Laptop',
                description: 'Soporte ajustable de aluminio',
                category: 'Accesorios',
                priceUSD: 25.00,
                costUSD: 15.00,
                stock: 30,
                minStock: 10,
            },
        ]

        for (const productData of products) {
            const existing = await prisma.product.findFirst({
                where: {
                    companyId: company.id,
                    sku: productData.sku,
                },
            })

            if (existing) {
                console.log(`⏭️  Product ${productData.sku} already exists, skipping...`)
                continue
            }

            await prisma.product.create({
                data: {
                    companyId: company.id,
                    sku: productData.sku,
                    name: productData.name,
                    description: productData.description,
                    category: productData.category,
                    priceUSD: productData.priceUSD,
                    priceBS: productData.priceUSD * rate,
                    costUSD: productData.costUSD,
                    costBS: productData.costUSD * rate,
                    stock: productData.stock,
                    minStock: productData.minStock,
                },
            })

            console.log(`✅ Created product: ${productData.name}`)
        }

        console.log('\n✅ Products seeded successfully!')
        console.log(`   Total products: ${products.length}`)
        console.log(`   BCV Rate used: ${rate}`)
    } catch (error) {
        console.error('❌ Error seeding products:', error)
    } finally {
        await prisma.$disconnect()
    }
}

seedProducts()
