import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create Company
    const company = await prisma.company.create({
        data: {
            name: 'Inversiones Nova C.A.',
            rif: 'J-12345678-9',
            address: 'Caracas, Venezuela',
            phone: '0212-1234567'
        }
    })
    console.log('Company created:', company.id, company.name)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
