import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed roles
  console.log('Seeding roles...')
  await prisma.role.createMany({
    data: [
      { roleId: 1, roleName: 'USER' },
      { roleId: 2, roleName: 'BUSINESS_OWNER' },
      { roleId: 3, roleName: 'ADMIN' },
    ],
    skipDuplicates: true,
  })
  console.log('Roles seeded')

  // Seed categories
  console.log('Seeding categories...')
  await prisma.category.createMany({
    data: [
      { categoryName: 'Information Technology' },
      { categoryName: 'Education' },
      { categoryName: 'Healthcare' },
      { categoryName: 'Finance' },
      { categoryName: 'Retail' },
    ],
    skipDuplicates: true,
  })
  console.log('Categories seeded')

  // Seed reasons
  console.log('Seeding reasons...')
  await prisma.reason.createMany({
    data: [
      { name: 'Spam' },
      { name: 'Fake Review' },
      { name: 'Harassment' },
      { name: 'Offensive Content' },
      { name: 'Conflict of Interest' },
      { name: 'Other' },
    ],
    skipDuplicates: true,
  })
  console.log('Reasons seeded')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
