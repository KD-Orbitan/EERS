import { PrismaClient, BusinessStatus, ReviewStatus, ReportStatus, BusinessClaimStatus } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { hash } from 'bcrypt'

// Run with an explicit environment file; defaults to a read-only preview.
// node --env-file=.env -r ts-node/register prisma/seed-admin-demo.ts [--apply]
const prisma = new PrismaClient()
const prefix = 'admin-demo-20260913'
const email = (kind: string, index: number) => `${prefix}-${kind}-${index}@example.invalid`
const date = (index: number) => new Date(Date.UTC(2026, 8, 1, 8, index * 17))
const categoryNames = ['Nhà hàng', 'Cà phê', 'Khách sạn', 'Du lịch', 'Vận tải', 'Sửa chữa ô tô', 'Nội thất', 'Thể thao', 'Làm đẹp', 'Thú cưng', 'Nông sản', 'Dịch vụ vệ sinh']
const criterionNames = ['Chất lượng phục vụ', 'Thời gian phản hồi', 'Minh bạch giá cả', 'Sự thuận tiện', 'Vệ sinh không gian', 'Độ chính xác thông tin', 'Hỗ trợ sau dịch vụ', 'Khả năng tiếp cận', 'Quy trình đặt lịch', 'Thái độ nhân viên', 'Chính sách đổi trả', 'Trải nghiệm tổng thể']
const names = ['Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Thu Hà', 'Phạm Hoàng Nam', 'Võ Ngọc Linh', 'Đặng Gia Huy', 'Bùi Thanh Mai', 'Đỗ Tuấn Kiệt', 'Hồ Phương Thảo', 'Ngô Đức Long']
const brands = ['An Nhiên', 'Minh Tâm', 'Bình Minh', 'Hương Việt', 'Phố Xanh', 'Ánh Dương', 'Thanh Bình', 'Gia Phúc', 'Hoàng Gia', 'Sen Việt']
const comments = [
  'Nhân viên hướng dẫn rõ ràng, quy trình tiếp nhận nhanh và không gian được sắp xếp gọn gàng.',
  'Chất lượng dịch vụ phù hợp với thông tin giới thiệu. Tôi mong có thêm lựa chọn đặt lịch vào cuối tuần.',
  'Thời gian chờ còn lâu vào giờ cao điểm. Nhân viên đã giải thích và hỗ trợ điều chỉnh lịch hẹn.',
  'Bảng giá dễ theo dõi, chi phí được xác nhận trước. Khâu phản hồi sau dịch vụ cần nhanh hơn.',
  'Địa điểm thuận tiện, nhân viên nhiệt tình. Biển chỉ dẫn tại lối vào có thể làm rõ hơn.',
]

async function main() {
  const [roles, admins, existing] = await Promise.all([
    prisma.role.findMany(),
    prisma.user.findMany({ where: { role: { roleName: 'ADMIN' }, deletedAt: null, status: 'active' }, select: { userId: true } }),
    prisma.user.count({ where: { email: { startsWith: prefix } } }),
  ])
  const roleId = (name: string) => {
    const role = roles.find((item) => item.roleName === name)
    if (!role) throw new Error(`Missing ${name} role. Run the base seed first.`)
    return role.roleId
  }
  roleId('USER')
  roleId('BUSINESS_OWNER')
  if (!admins.length) throw new Error('An active admin is required for demo moderation records.')
  console.log(JSON.stringify({ apply: process.argv.includes('--apply'), existingDemoUsers: existing,
    planned: { users: 90, businesses: 210, claims: 90, reviews: 160, reports: 100, notificationsPerAdmin: 60, categories: 12, criteria: 12 } }))
  if (!process.argv.includes('--apply')) return

  // Random, undisclosed passwords prevent demo accounts from becoming shared logins.
  const password = await hash(randomBytes(48).toString('hex'), 12)
  const added = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260913, 210)`
    const counts = { users: 0, businesses: 0, claims: 0, reviews: 0, reports: 0, notifications: 0, categories: 0, criteria: 0 }
    const categories: number[] = []
    const newCategoryIds = new Set<number>()
    const criteria: number[] = []
    for (const categoryName of categoryNames) {
      let item = await tx.category.findUnique({ where: { categoryName } })
      if (!item) { item = await tx.category.create({ data: { categoryName } }); counts.categories++; newCategoryIds.add(item.categoryId) }
      categories.push(item.categoryId)
    }
    for (const name of criterionNames) {
      let item = await tx.criterion.findUnique({ where: { name } })
      if (!item) { item = await tx.criterion.create({ data: { name, description: `Đánh giá ${name.toLocaleLowerCase()} dựa trên trải nghiệm sử dụng thực tế.` } }); counts.criteria++ }
      criteria.push(item.criterionId)
    }
    // Only add mappings to categories created by this batch.
    // Existing category configuration remains untouched; new demo reviews use its actual mappings.
    for (let i = 0; i < categories.length; i++) {
      const categoryId = categories[i]
      if (newCategoryIds.has(categoryId)) {
        for (const criterionId of criteria) {
          await tx.categoryCriterion.create({ data: { categoryId, criterionId } })
          await tx.criterionWeight.upsert({ where: { categoryId_criterionId: { categoryId, criterionId } }, update: {}, create: { categoryId, criterionId, weight: 1 / criteria.length } })
        }
      }
    }
    const users: bigint[] = []
    for (let i = 0; i < 90; i++) {
      let user = await tx.user.findUnique({ where: { email: email('user', i) } })
      if (!user) {
        user = await tx.user.create({ data: { email: email('user', i), name: `[Demo] ${names[i % names.length]} ${i + 1}`, password,
          roleId: roleId(i < 30 ? 'BUSINESS_OWNER' : 'USER'), status: i >= 80 ? 'banned' : i >= 70 ? 'inactive' : 'active', createdAt: date(i) } })
        counts.users++
      }
      users.push(user.userId)
    }
    const businesses: bigint[] = []
    console.log('Prepared demo users and reference data (transaction not yet committed).')
    for (let i = 0; i < 210; i++) {
      const categoryId = categories[i % categories.length]
      const status: BusinessStatus = i < 60 ? 'pending' : i < 80 ? 'approved' : i < 100 ? 'rejected' : i < 120 ? 'hidden' : 'approved'
      const claimIndex = i - 120
      const ownerUserId = i < 120 ? users[i % 30] : claimIndex >= 60 && claimIndex < 75 ? users[claimIndex % 30] : null
      let business = await tx.business.findUnique({ where: { email: email('business', i) } })
      if (!business) {
        business = await tx.business.create({ data: {
          email: email('business', i), phone: `+999913${String(i).padStart(6, '0')}`,
          name: `[Demo] ${categoryNames[i % categories.length]} ${brands[i % brands.length]} ${i + 1}`,
          description: 'Doanh nghiệp mẫu để kiểm thử tìm kiếm, phân trang và quy trình kiểm duyệt của quản trị viên.',
          status, ownerUserId, approvedByUserId: status === 'approved' ? admins[0].userId : null, createdAt: date(i),
          businessCategories: { create: { categoryId } },
          locations: { create: { location: { create: { addressLine: `${i + 1} Nguyễn Văn Linh (dữ liệu mẫu)`, ward: 'Phường Tân Phong', province: 'Thành phố Hồ Chí Minh' } } } },
        } })
        counts.businesses++
      }
      businesses.push(business.businessId)
      if (i >= 120) {
        const message = `[${prefix}-claim-${claimIndex}] Tôi là đại diện của cơ sở ${business.name}, đề nghị xác minh quyền quản lý. Hồ sơ đăng ký và thông tin liên hệ đã được chuẩn bị để đối chiếu.`
        const exists = await tx.businessClaim.findFirst({ where: { businessId: business.businessId, message: { startsWith: `[${prefix}-claim-${claimIndex}]` } } })
        if (!exists) {
          const claimStatus: BusinessClaimStatus = claimIndex < 60 ? 'pending' : claimIndex < 75 ? 'approved' : 'rejected'
          await tx.businessClaim.create({ data: { businessId: business.businessId, userId: users[claimIndex % 30], message, status: claimStatus,
            reviewedByUserId: claimStatus === 'pending' ? null : admins[0].userId, createdAt: date(i + 300) } })
          counts.claims++
        }
      }
    }
    const reviews: bigint[] = []
    console.log('Prepared demo businesses and claims (transaction not yet committed).')
    const changedBusinesses = new Set<bigint>()
    for (let i = 0; i < 160; i++) {
      const businessId = businesses[120 + i % 90]
      const writerUserId = users[30 + i % 40]
      let review = await tx.review.findFirst({ where: { businessId, writerUserId } })
      if (!review) {
        const status: ReviewStatus = i < 80 ? 'pending' : i < 120 ? 'approved' : i < 140 ? 'rejected' : 'hidden'
        const overallRating = 1 + i % 5
        const assigned = await tx.categoryCriterion.findMany({ where: { categoryId: categories[(120 + i % 90) % categories.length] } })
        review = await tx.review.create({ data: { businessId, writerUserId, status, overallRating,
          content: `[Demo ${i + 1}] ${comments[i % comments.length]} Trải nghiệm tại chi nhánh ${121 + i % 90}, lượt sử dụng ${i + 1}.`,
          createdAt: date(i + 600), managedByUserId: status === 'pending' ? null : admins[0].userId,
          reviewCriteria: { create: assigned.map(({ criterionId }) => ({ criterionId, ratingValue: overallRating })) },
        } })
        counts.reviews++
        changedBusinesses.add(businessId)
      }
      reviews.push(review.reviewId)
    }
    for (const businessId of changedBusinesses) {
      const average = await tx.review.aggregate({ where: { businessId, deletedAt: null, status: 'approved' }, _avg: { overallRating: true } })
      await tx.business.update({ where: { businessId }, data: { avgRating: average._avg.overallRating ?? 0 } })
    }
    console.log('Prepared demo reviews (transaction not yet committed).')
    let reason = await tx.reason.findFirst({ where: { name: 'Spam' } })
    if (!reason) reason = await tx.reason.create({ data: { name: 'Spam', description: 'Nội dung lặp lại hoặc không liên quan.' } })
    for (let i = 0; i < 100; i++) {
      const userId = users[30 + (i + 1) % 40]
      // Reports refer to approved reviews; each reporter/review pair is unique.
      const reviewId = reviews[80 + i % 40]
      const reporterId = i < 40 ? userId : users[30 + (i + (i < 80 ? 2 : 3)) % 40]
      const exists = await tx.report.findUnique({ where: { userId_reviewId: { userId: reporterId, reviewId } } })
      if (!exists) {
        const status: ReportStatus = i < 60 ? 'pending' : i < 75 ? 'reviewing' : i < 90 ? 'resolved' : 'rejected'
        await tx.report.create({ data: { userId: reporterId, reviewId, reasonId: reason.reasonId, status,
          description: `[${prefix}-report-${i}] Đề nghị kiểm tra nội dung đánh giá có dấu hiệu lặp lại, thông tin chưa phản ánh trải nghiệm thực tế.`, createdAt: date(i + 900) } })
        counts.reports++
      }
    }
    for (const admin of admins) {
      for (let i = 0; i < 60; i++) {
        const title = `[Demo] ${i % 2 ? 'Yêu cầu xác minh doanh nghiệp' : 'Báo cáo đánh giá mới'} #${i + 1}`
        const content = `[${prefix}-notification-${i}] Có hồ sơ mới cần kiểm tra trong ${i % 2 ? 'Business Claims' : 'Report Management'}.`
        if (!await tx.notification.findFirst({ where: { userId: admin.userId, content } })) {
          await tx.notification.create({ data: { userId: admin.userId, title, content, type: i % 2 ? 'CLAIM_SUBMITTED' : 'REPORT_CREATED', isRead: i >= 45, createdAt: date(i + 1200) } })
          counts.notifications++
        }
      }
    }
    return counts
  }, { timeout: 600_000 })
  console.log(JSON.stringify({ added }))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[database URL]') : 'Seed failed')
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
