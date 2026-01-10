import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Get company
    const company = await prisma.company.findFirst()
    if (!company) {
        console.error('No company found! Run seed-company.ts first.')
        process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin user
    const user = await prisma.user.upsert({
        where: { email: 'admin@nova-adm.com' },
        update: {},
        create: {
            companyId: company.id,
            email: 'admin@nova-adm.com',
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    console.log('Admin user created:')
    console.log('  Email:', user.email)
    console.log('  Password: admin123')
    console.log('  Role:', user.role)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
