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

  console.log('Seeding scoring config...')
  await prisma.scoringConfig.createMany({
    data: [{
      configId: 1,
      bayesianC: 3.5,
      bayesianM: 10,
      fraudLambda1: 0.4,
      fraudLambda2: 0.4,
      fraudLambda3: 0.2,
      thetaDup: 0.85,
      lDup: 20,
      thetaSpam: 5,
      spamWindowHours: 24,
      thetaSus: 0.3,
      thetaReject: 0.7,
      trustAlpha: 0.5,
      trustBeta: 0.3,
      trustGamma: 0.2,
      suspiciousDelta: 0.3,
      timeDecayLambda: 0.01,
      sentimentLambda: 0.0,
      weightAlpha: 0.4,
      weightBeta: 0.4,
      weightGamma: 0.2,
      lMin: 10,
    }],
    skipDuplicates: true,
  })
  console.log('Scoring config seeded')

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
