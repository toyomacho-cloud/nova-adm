
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Check Company
    let company = await prisma.company.findFirst()
    if (!company) {
        console.log('Creating Demo Company...')
        company = await prisma.company.create({
            data: {
                name: 'Inversiones Nova C.A.',
                rif: 'J-12345678-9',
                address: 'Demo Address',
                phone: '555-0123'
            }
        })
        console.log('Company created:', company.id)
    } else {
        console.log('Company exists:', company.id)
    }

    // Check User
    const email = 'demo@nova.com'
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.log('Creating Demo User...')
        const password = await hash('Password123!', 12)
        user = await prisma.user.create({
            data: {
                email,
                password,
                name: 'Demo Admin',
                role: 'ADMIN',
                companyId: company.id
            }
        })
        console.log('User created:', user.email)
    } else {
        console.log('User exists:', user.email)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
