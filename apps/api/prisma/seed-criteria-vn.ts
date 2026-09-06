// One-off script: seed a generic set of 4 review criteria and assign them to
// every category. Without this, MultiCriteriaScoringService.computeScore()
// has nothing to score against (empty CategoryCriterion), so every review's
// per-criterion score is 0 and rankingScore collapses to the same Bayesian
// prior for every business (see ranking-calculation.service.ts D-012).
// Not part of seed.ts (that must stay deterministic/minimal) — run manually:
//   pnpm --filter api exec ts-node prisma/seed-criteria-vn.ts
// Weight is left at CriterionWeight's schema default (1.0) — not created
// here; MultiCriteriaScoringService already falls back to 1.0 when no
// CriterionWeight row exists for a (category, criterion) pair.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Order matches seed-reviews-vn.ts's CRITERION_VARIANCE spread (4 entries).
const CRITERIA = [
  { name: 'Chất lượng dịch vụ', description: 'Mức độ hài lòng về chất lượng sản phẩm/dịch vụ nhận được.' },
  { name: 'Giá cả hợp lý', description: 'Mức độ tương xứng giữa chi phí bỏ ra và giá trị nhận được.' },
  { name: 'Thái độ nhân viên', description: 'Sự nhiệt tình, chuyên nghiệp của nhân viên/đội ngũ phục vụ.' },
  { name: 'Thời gian phản hồi', description: 'Tốc độ xử lý yêu cầu, phản hồi hoặc hỗ trợ khách hàng.' },
]

async function main() {
  console.log('Seeding generic criteria...')

  const criteria: Awaited<ReturnType<typeof prisma.criterion.upsert>>[] = []
  for (const c of CRITERIA) {
    const criterion = await prisma.criterion.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    })
    criteria.push(criterion)
    console.log(`Criterion "${criterion.name}" (id=${criterion.criterionId})`)
  }

  const categories = await prisma.category.findMany()
  for (const category of categories) {
    for (const criterion of criteria) {
      await prisma.categoryCriterion.upsert({
        where: { categoryId_criterionId: { categoryId: category.categoryId, criterionId: criterion.criterionId } },
        update: {},
        create: { categoryId: category.categoryId, criterionId: criterion.criterionId },
      })
    }
    console.log(`Assigned ${criteria.length} criteria to category "${category.categoryName}"`)
  }

  console.log('Done seeding criteria.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
