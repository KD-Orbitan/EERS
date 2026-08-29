// One-off script: seed realistic Vietnamese reviews (status='approved') for the
// 10 Vietnam sample businesses created by prisma/seed-businesses-vn.ts (phone
// 0901000001..10). Playwright/e2e test businesses are intentionally untouched.
// Not part of seed.ts (that must stay deterministic/minimal) — run manually:
//   pnpm --filter api exec ts-node prisma/seed-reviews-vn.ts
//
// Creates a small pool of dedicated demo reviewer accounts (role USER) so
// review authorship reads naturally instead of reusing e2e test accounts.
// Bypasses CreateReviewUseCase (this is offline seed data, not a live user
// action) but mirrors its invariants: one active review per
// (writerUserId, businessId), overallRating 1-5, criteriaRatings restricted
// to the criteria configured for the business's category.
//
// Business.avg_rating and ranking_snapshots are NOT updated here — per
// DECISIONS.md D-011, ranking/aggregate calculation only happens in
// RankingCalculationService. After running this script, trigger a real
// recalculation (POST /admin/rankings/recalculate) to see the new reviews
// reflected in avgRating and the leaderboard.
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const DAY_MS = 24 * 60 * 60 * 1000

const REVIEWERS = [
  { name: 'Nguyễn Văn An', email: 'demo-reviewer-1@eers-demo.vn' },
  { name: 'Trần Thị Bình', email: 'demo-reviewer-2@eers-demo.vn' },
  { name: 'Lê Hoàng Nam', email: 'demo-reviewer-3@eers-demo.vn' },
  { name: 'Phạm Thị Hương', email: 'demo-reviewer-4@eers-demo.vn' },
  { name: 'Đỗ Minh Tuấn', email: 'demo-reviewer-5@eers-demo.vn' },
  { name: 'Vũ Thị Lan', email: 'demo-reviewer-6@eers-demo.vn' },
  { name: 'Hoàng Văn Đức', email: 'demo-reviewer-7@eers-demo.vn' },
  { name: 'Bùi Thị Mai', email: 'demo-reviewer-8@eers-demo.vn' },
  { name: 'Đặng Quốc Huy', email: 'demo-reviewer-9@eers-demo.vn' },
  { name: 'Ngô Thị Thu', email: 'demo-reviewer-10@eers-demo.vn' },
  { name: 'Phan Văn Khoa', email: 'demo-reviewer-11@eers-demo.vn' },
  { name: 'Trịnh Thị Ngọc', email: 'demo-reviewer-12@eers-demo.vn' },
]

const reviewsByPhone: Record<string, Array<{ rating: number; content: string }>> = {
  // Công ty TNHH Công nghệ VietSoft (IT)
  '0901000001': [
    { rating: 5, content: 'Đội ngũ VietSoft tư vấn giải pháp phần mềm rất tận tâm, đúng tiến độ cam kết. Sau 3 tháng triển khai hệ thống quản lý bán hàng, quy trình nội bộ của công ty mình gọn gàng hơn hẳn.' },
    { rating: 5, content: 'Code chất lượng, tài liệu bàn giao đầy đủ, hỗ trợ sau bảo hành nhanh chóng qua Zalo. Rất hài lòng khi hợp tác làm website thương mại điện tử.' },
    { rating: 4, content: 'Sản phẩm đáp ứng đúng yêu cầu, tuy nhiên giai đoạn đầu trao đổi requirement hơi mất thời gian do cần làm rõ nhiều chi tiết. Chất lượng cuối cùng ổn.' },
    { rating: 5, content: 'Team dev nắm bắt nghiệp vụ nhanh, chủ động đề xuất cải tiến UX cho app quản lý kho. Giá cả hợp lý so với chất lượng nhận được.' },
    { rating: 4, content: 'Dự án hoàn thành đúng deadline, có vài lỗi nhỏ phát sinh sau khi go-live nhưng được xử lý trong vòng 24h. Sẽ tiếp tục hợp tác lâu dài.' },
    { rating: 5, content: 'Rất chuyên nghiệp từ khâu ký hợp đồng đến bàn giao. Đặc biệt ấn tượng với khả năng tối ưu hiệu năng hệ thống, tốc độ tải trang cải thiện rõ rệt.' },
  ],
  // Trung tâm Anh ngữ Bright Future (Education)
  '0901000002': [
    { rating: 4, content: 'Giáo viên nhiệt tình, giáo trình cập nhật theo chuẩn quốc tế. Con mình học 6 tháng đã tự tin giao tiếp hơn nhiều.' },
    { rating: 5, content: 'Lớp học sĩ số nhỏ nên giáo viên quan tâm sát từng học viên. Rất hài lòng với lộ trình luyện thi IELTS ở đây.' },
    { rating: 4, content: 'Cơ sở vật chất khang trang, phòng học có máy chiếu và tài liệu nghe nhìn đầy đủ. Học phí hơi cao so với mặt bằng chung.' },
    { rating: 3, content: 'Chất lượng giảng dạy tốt nhưng lịch học hay bị đổi giáo viên phụ trách, ảnh hưởng đến tính liên tục của khóa học.' },
    { rating: 5, content: 'Trung tâm tổ chức nhiều hoạt động ngoại khóa bằng tiếng Anh giúp học viên thực hành tự nhiên hơn là chỉ học trong sách vở.' },
    { rating: 4, content: 'Đội ngũ tư vấn nhiệt tình, theo sát tiến độ học tập và báo cáo định kỳ cho phụ huynh. Kết quả học tập cải thiện rõ sau mỗi khóa.' },
  ],
  // Phòng khám Đa khoa An Tâm (Healthcare)
  '0901000003': [
    { rating: 5, content: 'Bác sĩ khám tận tình, giải thích rõ tình trạng bệnh và hướng điều trị. Không gian phòng khám sạch sẽ, thoáng mát.' },
    { rating: 4, content: 'Đặt lịch qua điện thoại khá thuận tiện, thời gian chờ khám hơi lâu vào buổi sáng cuối tuần.' },
    { rating: 5, content: 'Xét nghiệm có kết quả nhanh trong ngày, nhân viên tư vấn nhiệt tình về chế độ dinh dưỡng sau khám.' },
    { rating: 4, content: 'Chất lượng khám chữa bệnh tốt, chi phí hợp lý so với các phòng khám tư nhân khác trong khu vực.' },
    { rating: 4, content: 'Phòng khám có đầy đủ chuyên khoa, tuy nhiên bãi đỗ xe hơi nhỏ vào giờ cao điểm.' },
    { rating: 5, content: 'Đội ngũ điều dưỡng chu đáo, theo dõi sát sau khi tiêm ngừa. Sẽ tiếp tục đưa gia đình đến khám định kỳ ở đây.' },
  ],
  // Công ty Tài chính Thịnh Vượng (Finance)
  '0901000004': [
    { rating: 4, content: 'Nhân viên tư vấn khoản vay rõ ràng về lãi suất và kỳ hạn, thủ tục giải ngân nhanh hơn mình nghĩ.' },
    { rating: 3, content: 'Lãi suất cạnh tranh nhưng quy trình thẩm định hồ sơ khá rườm rà, mất gần 2 tuần mới hoàn tất.' },
    { rating: 4, content: 'Dịch vụ tư vấn đầu tư khá chuyên nghiệp, có báo cáo định kỳ hàng tháng giúp mình theo dõi danh mục dễ dàng.' },
    { rating: 4, content: 'Chăm sóc khách hàng qua hotline phản hồi nhanh, tuy nhiên app quản lý tài khoản đôi lúc bị lỗi đăng nhập.' },
    { rating: 3, content: 'Được tư vấn nhiệt tình lúc đăng ký nhưng sau khi ký hợp đồng thì việc liên hệ hỗ trợ chậm hơn hẳn.' },
    { rating: 5, content: 'Gói vay tiêu dùng linh hoạt, không phát sinh phí ẩn như một số nơi khác mình từng tìm hiểu. Rất hài lòng.' },
  ],
  // Siêu thị Mini Xanh (Retail)
  '0901000005': [
    { rating: 4, content: 'Rau củ tươi, có nguồn gốc rõ ràng, giá cả hợp lý hơn so với siêu thị lớn gần nhà.' },
    { rating: 4, content: 'Nhân viên thu ngân nhanh nhẹn, cửa hàng sạch sẽ. Thi thoảng hết hàng một số mặt hàng thiết yếu vào cuối tuần.' },
    { rating: 3, content: 'Chất lượng thực phẩm ổn nhưng bãi giữ xe hơi chật, giờ cao điểm khó tìm chỗ để xe.' },
    { rating: 5, content: 'Chương trình khuyến mãi hàng tuần khá hấp dẫn, ứng dụng tích điểm đổi quà tiện lợi. Mua sắm ở đây khá thường xuyên.' },
    { rating: 4, content: 'Khu vực đồ đông lạnh và sữa được bảo quản tốt, hạn sử dụng luôn được kiểm tra kỹ trước khi lên kệ.' },
    { rating: 4, content: 'Nhân viên hỗ trợ nhiệt tình khi mình hỏi về sản phẩm mới, quầy thanh toán ít khi phải xếp hàng lâu.' },
  ],
  // Công ty TNHH Giải pháp Phần mềm Sao Việt (IT)
  '0901000006': [
    { rating: 4, content: 'Gia công phần mềm đúng chuẩn, giao tiếp qua email khá chậm nhưng chất lượng code sạch, dễ maintain.' },
    { rating: 5, content: 'Đội QA kiểm thử kỹ, hầu như không phát sinh bug lớn sau khi bàn giao. Rất đáng tin cậy cho các dự án outsourcing dài hạn.' },
    { rating: 4, content: 'Tích hợp hệ thống ERP cho công ty mình khá mượt, đội kỹ thuật hỗ trợ nhiệt tình khi có sự cố phát sinh cuối tuần.' },
    { rating: 4, content: 'Giá thành cạnh tranh so với mặt bằng chung, tài liệu kỹ thuật rõ ràng. Cần cải thiện thêm tốc độ phản hồi ban đầu.' },
    { rating: 3, content: 'Chất lượng sản phẩm ổn nhưng thay đổi nhân sự dự án giữa chừng khiến tiến độ bị chậm gần 2 tuần so với kế hoạch.' },
    { rating: 5, content: 'Ấn tượng với năng lực xử lý hệ thống lớn, migrate dữ liệu hàng triệu bản ghi không gặp sự cố. Rất recommend cho doanh nghiệp cần scale hệ thống.' },
  ],
  // Trường Mầm non Hoa Hướng Dương (Education)
  '0901000007': [
    { rating: 5, content: 'Trường sạch sẽ, giáo viên yêu trẻ và kiên nhẫn. Con mình đi học rất vui vẻ, không còn quấy khóc như trước.' },
    { rating: 5, content: 'Chương trình song ngữ được xây dựng bài bản, bé nhà mình học được nhiều từ vựng tiếng Anh cơ bản chỉ sau 1 học kỳ.' },
    { rating: 4, content: 'Cơ sở vật chất tốt, sân chơi rộng rãi an toàn. Bữa ăn bán trú đa dạng nhưng đôi lúc thực đơn lặp lại.' },
    { rating: 5, content: 'Giáo viên chủ nhiệm thường xuyên cập nhật hình ảnh, video hoạt động của bé qua app, phụ huynh rất yên tâm.' },
    { rating: 4, content: 'Trường có camera giám sát lớp học, học phí ở mức hợp lý so với chất lượng chăm sóc nhận được.' },
    { rating: 5, content: 'Đội ngũ y tế trường theo dõi sức khỏe bé sát sao, xử lý kịp thời khi bé bị sốt nhẹ trong giờ học. Rất an tâm khi gửi con ở đây.' },
  ],
  // Nha khoa Sài Gòn Smile (Healthcare)
  '0901000008': [
    { rating: 5, content: 'Nha sĩ tay nghề cao, quy trình nhổ răng khôn diễn ra nhanh và gần như không đau. Rất chuyên nghiệp.' },
    { rating: 5, content: 'Trang thiết bị hiện đại, phòng khám vô trùng kỹ lưỡng. Bọc răng sứ xong hàm răng đều và tự nhiên hơn hẳn.' },
    { rating: 5, content: 'Tư vấn rõ ràng về chi phí trước khi điều trị, không phát sinh thêm khoản nào ngoài dự kiến. Rất đáng tin cậy.' },
    { rating: 4, content: 'Chất lượng điều trị tốt, chỉ tiếc là phải đặt lịch trước khá lâu mới có suất khám vào giờ mong muốn.' },
    { rating: 5, content: 'Nhổ răng cho bé nhà mình mà bé không hề sợ, nhờ bác sĩ nhẹ nhàng và phòng khám trang trí thân thiện với trẻ em.' },
    { rating: 5, content: 'Chăm sóc khách hàng chu đáo, nhắn tin nhắc lịch tái khám đầy đủ. Kết quả niềng răng sau 18 tháng vượt kỳ vọng.' },
  ],
  // Công ty Bảo hiểm An Bình (Finance)
  '0901000009': [
    { rating: 4, content: 'Tư vấn viên giải thích quyền lợi bảo hiểm khá dễ hiểu, hỗ trợ nhiệt tình khi mình làm hồ sơ bồi thường.' },
    { rating: 3, content: 'Thời gian xử lý hồ sơ bồi thường hơi lâu, phải gọi điện nhắc vài lần mới có phản hồi cập nhật.' },
    { rating: 3, content: 'Gói bảo hiểm sức khỏe khá đầy đủ nhưng điều khoản loại trừ khá nhiều, nên đọc kỹ hợp đồng trước khi ký.' },
    { rating: 4, content: 'Nhân viên chăm sóc khách hàng thân thiện, nhắc lịch đóng phí đều đặn qua tin nhắn nên không bị quên hạn.' },
    { rating: 3, content: 'Chất lượng tư vấn ban đầu tốt nhưng đổi nhân viên phụ trách nhiều lần khiến việc theo dõi hợp đồng hơi bất tiện.' },
    { rating: 4, content: 'Quy trình bồi thường minh bạch, có hướng dẫn cụ thể từng bước nộp hồ sơ trên website nên khá dễ làm theo.' },
  ],
  // Cửa hàng Điện máy Việt Phát (Retail)
  '0901000010': [
    { rating: 4, content: 'Nhân viên tư vấn kỹ về thông số kỹ thuật, không ép mua thêm phụ kiện không cần thiết như một số cửa hàng khác.' },
    { rating: 4, content: 'Giao hàng lắp đặt máy lạnh đúng hẹn, kỹ thuật viên làm việc gọn gàng và vệ sinh sạch sau khi lắp.' },
    { rating: 5, content: 'Giá tốt hơn so với vài nơi mình tham khảo, chương trình bảo hành 2 năm khá yên tâm khi mua tivi ở đây.' },
    { rating: 3, content: 'Sản phẩm chính hãng nhưng thời gian chờ bảo hành hơi lâu, mất gần 1 tuần mới nhận lại máy giặt.' },
    { rating: 4, content: 'Cửa hàng trưng bày đa dạng mẫu mã, có khu trải nghiệm sản phẩm trước khi mua khá tiện cho khách.' },
    { rating: 5, content: 'Đổi trả hàng lỗi nhanh gọn không rắc rối, đội ngũ CSKH gọi điện xác nhận đơn hàng chu đáo trước khi giao.' },
  ],
}

// Small deterministic spread so a criterion rating isn't always identical to
// overallRating, without needing per-criterion authored data.
const CRITERION_VARIANCE = [0, 1, -1, 0]

function clampRating(value: number) {
  return Math.min(5, Math.max(1, value))
}

async function ensureReviewers() {
  const passwordHash = await bcrypt.hash('Demo@12345', 12)
  const role = await prisma.role.findUnique({ where: { roleName: 'USER' } })
  if (!role) {
    throw new Error('USER role not found — run prisma/seed.ts first.')
  }

  const users: Awaited<ReturnType<typeof prisma.user.upsert>>[] = []
  for (const reviewer of REVIEWERS) {
    const user = await prisma.user.upsert({
      where: { email: reviewer.email },
      update: {},
      create: {
        name: reviewer.name,
        email: reviewer.email,
        password: passwordHash,
        roleId: role.roleId,
        status: 'active',
      },
    })
    users.push(user)
  }
  return users
}

async function main() {
  console.log('Seeding demo reviewer accounts...')
  const reviewers = await ensureReviewers()
  console.log(`${reviewers.length} demo reviewer account(s) ready.`)

  const phones = Object.keys(reviewsByPhone)
  const businesses = await prisma.business.findMany({
    where: { phone: { in: phones } },
    select: { businessId: true, name: true, phone: true },
  })
  if (businesses.length < phones.length) {
    console.warn(`Only found ${businesses.length}/${phones.length} target businesses — run prisma/seed-businesses-vn.ts first.`)
  }

  let created = 0
  let skipped = 0

  for (const [businessIndex, business] of businesses.entries()) {
    const reviews = reviewsByPhone[business.phone]
    if (!reviews) continue

    const categoryCriteria = await prisma.categoryCriterion.findMany({
      where: { category: { businessCategories: { some: { businessId: business.businessId } } } },
      select: { criterionId: true },
    })

    // Rotate through the reviewer pool with a step co-prime to its size so
    // each business gets a different-looking set of authors.
    const poolSize = reviewers.length
    const start = (businessIndex * 5) % poolSize

    for (const [reviewIndex, review] of reviews.entries()) {
      const writer = reviewers[(start + reviewIndex) % poolSize]

      const existing = await prisma.review.findFirst({
        where: { writerUserId: writer.userId, businessId: business.businessId, deletedAt: null },
      })
      if (existing) {
        skipped++
        continue
      }

      const daysAgo = (reviews.length - reviewIndex) * 18
      const createdAt = new Date(Date.now() - daysAgo * DAY_MS)

      await prisma.$transaction(async (tx) => {
        const createdReview = await tx.review.create({
          data: {
            writerUserId: writer.userId,
            businessId: business.businessId,
            overallRating: review.rating,
            content: review.content,
            status: 'approved',
            createdAt,
            updatedAt: createdAt,
          },
        })

        await Promise.all(
          categoryCriteria.map((criterion, i) =>
            tx.reviewCriterion.create({
              data: {
                reviewId: createdReview.reviewId,
                criterionId: criterion.criterionId,
                ratingValue: clampRating(review.rating + CRITERION_VARIANCE[i % CRITERION_VARIANCE.length]),
                createdAt,
              },
            }),
          ),
        )
      })

      created++
    }

    console.log(`Seeded reviews for "${business.name}" (id=${business.businessId}).`)
  }

  console.log(`Done. Created ${created} review(s), skipped ${skipped} already-existing (writer, business) pair(s).`)
  console.log('Reviews are status=approved but Business.avgRating and ranking_snapshots only update on the next real ranking recalculation.')
  console.log('Trigger one via POST /admin/rankings/recalculate (admin auth) to see it reflected in avgRating and the leaderboard.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
