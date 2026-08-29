// One-off script: insert 10 sample businesses located in Vietnam for local testing/demo data.
// Not part of seed.ts (that must stay deterministic/minimal) — run manually:
//   pnpm --filter api exec ts-node prisma/seed-businesses-vn.ts
// Mirrors the admin-created-business flow (D-033): status='approved', ownerUserId=null.
// Coordinates are intentionally left null — never set lat/lng from a script (D-032).
// Run prisma/backfill-location-coordinates.ts afterwards to geocode these locations.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const businesses = [
  {
    name: 'Công ty TNHH Công nghệ VietSoft',
    description: 'Phát triển phần mềm và giải pháp chuyển đổi số cho doanh nghiệp vừa và nhỏ.',
    phone: '0901000001',
    email: 'contact@vietsoft.vn',
    category: 'Information Technology',
    addressLine: '12 Duy Tân',
    ward: 'Dịch Vọng Hậu',
    province: 'Hà Nội',
  },
  {
    name: 'Trung tâm Anh ngữ Bright Future',
    description: 'Trung tâm đào tạo tiếng Anh giao tiếp và luyện thi chứng chỉ quốc tế.',
    phone: '0901000002',
    email: 'info@brightfuture.edu.vn',
    category: 'Education',
    addressLine: '45 Nguyễn Huệ',
    ward: 'Bến Nghé',
    province: 'Thành phố Hồ Chí Minh',
  },
  {
    name: 'Phòng khám Đa khoa An Tâm',
    description: 'Phòng khám đa khoa cung cấp dịch vụ khám chữa bệnh tổng quát và chuyên khoa.',
    phone: '0901000003',
    email: 'lienhe@antam-clinic.vn',
    category: 'Healthcare',
    addressLine: '78 Nguyễn Văn Linh',
    ward: 'Nam Dương',
    province: 'Đà Nẵng',
  },
  {
    name: 'Công ty Tài chính Thịnh Vượng',
    description: 'Cung cấp dịch vụ tư vấn tài chính, cho vay tiêu dùng và quản lý đầu tư.',
    phone: '0901000004',
    email: 'contact@thinhvuong-finance.vn',
    category: 'Finance',
    addressLine: '20 Láng Hạ',
    ward: 'Láng Hạ',
    province: 'Hà Nội',
  },
  {
    name: 'Siêu thị Mini Xanh',
    description: 'Chuỗi siêu thị mini cung cấp thực phẩm sạch và hàng tiêu dùng thiết yếu.',
    phone: '0901000005',
    email: null,
    category: 'Retail',
    addressLine: '156 Xô Viết Nghệ Tĩnh',
    ward: 'Thạnh Mỹ Tây',
    province: 'Thành phố Hồ Chí Minh',
  },
  {
    name: 'Công ty TNHH Giải pháp Phần mềm Sao Việt',
    description: 'Gia công phần mềm và tích hợp hệ thống cho khách hàng trong và ngoài nước.',
    phone: '0901000006',
    email: 'hello@saoviet-soft.vn',
    category: 'Information Technology',
    addressLine: '33 Nguyễn Văn Linh',
    ward: 'Hòa Cường Bắc',
    province: 'Đà Nẵng',
  },
  {
    name: 'Trường Mầm non Hoa Hướng Dương',
    description: 'Trường mầm non tư thục theo chương trình giáo dục sớm song ngữ.',
    phone: '0901000007',
    email: 'tuvan@hoahuongduong-school.edu.vn',
    category: 'Education',
    addressLine: '9 Bạch Mai',
    ward: 'Trương Định',
    province: 'Hà Nội',
  },
  {
    name: 'Nha khoa Sài Gòn Smile',
    description: 'Phòng khám nha khoa thẩm mỹ với trang thiết bị hiện đại.',
    phone: '0901000008',
    email: 'booking@saigonsmile.vn',
    category: 'Healthcare',
    addressLine: '221 Võ Văn Tần',
    ward: 'Võ Thị Sáu',
    province: 'Thành phố Hồ Chí Minh',
  },
  {
    name: 'Công ty Bảo hiểm An Bình',
    description: 'Cung cấp các gói bảo hiểm nhân thọ và sức khỏe cho cá nhân, gia đình.',
    phone: '0901000009',
    email: null,
    category: 'Finance',
    addressLine: '5 Trần Văn Khéo',
    ward: 'Cái Khế',
    province: 'Cần Thơ',
  },
  {
    name: 'Cửa hàng Điện máy Việt Phát',
    description: 'Kinh doanh điện máy, điện lạnh và thiết bị gia dụng chính hãng.',
    phone: '0901000010',
    email: 'sales@vietphat-dienmay.vn',
    category: 'Retail',
    addressLine: '88 Tô Hiệu',
    ward: 'Hồ Nam',
    province: 'Hải Phòng',
  },
]

async function main() {
  console.log('Seeding 10 Vietnam sample businesses...')

  for (const b of businesses) {
    const category = await prisma.category.findUnique({ where: { categoryName: b.category } })
    if (!category) {
      console.warn(`Category "${b.category}" not found — skipping "${b.name}". Run prisma/seed.ts first.`)
      continue
    }

    const business = await prisma.business.upsert({
      where: { phone: b.phone },
      update: {},
      create: {
        name: b.name,
        description: b.description,
        phone: b.phone,
        email: b.email,
        status: 'approved',
      },
    })

    const location = await prisma.location.create({
      data: {
        addressLine: b.addressLine,
        ward: b.ward,
        province: b.province,
      },
    })

    await prisma.businessLocation.upsert({
      where: { businessId_locationId: { businessId: business.businessId, locationId: location.locationId } },
      update: {},
      create: { businessId: business.businessId, locationId: location.locationId },
    })

    await prisma.businessCategory.upsert({
      where: { businessId_categoryId: { businessId: business.businessId, categoryId: category.categoryId } },
      update: {},
      create: { businessId: business.businessId, categoryId: category.categoryId },
    })

    console.log(`Seeded business "${b.name}" (id=${business.businessId})`)
  }

  console.log('Done seeding Vietnam sample businesses.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
