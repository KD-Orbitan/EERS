// One-off script: attach placeholder logo/cover/gallery images to the 10 Vietnam
// sample businesses created by prisma/seed-businesses-vn.ts. Run manually:
//   pnpm --filter api exec ts-node prisma/seed-business-images-vn.ts
//
// Images are NOT uploaded to Cloudinary — they are placeholder URLs (picsum.photos)
// stored directly as Image rows (secureUrl + a synthetic cloudinaryPublicId), for
// local/demo display only. cloudinary.uploader.destroy() resolves with
// { result: 'not found' } instead of throwing on an unknown public_id (per Cloudinary
// API), so replacing/deleting these later through the real upload endpoints is safe.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// phone -> slug, matching prisma/seed-businesses-vn.ts (business #1..#10)
const businessSlugs: Record<string, string> = {
  '0901000001': 'vietsoft',
  '0901000002': 'brightfuture',
  '0901000003': 'antam-clinic',
  '0901000004': 'thinhvuong-finance',
  '0901000005': 'minixanh',
  '0901000006': 'saoviet-soft',
  '0901000007': 'hoahuongduong-school',
  '0901000008': 'saigonsmile',
  '0901000009': 'anbinh-insurance',
  '0901000010': 'vietphat-dienmay',
}

const GALLERY_COUNT = 4

async function main() {
  console.log('Seeding placeholder images for Vietnam sample businesses...')

  for (const [phone, slug] of Object.entries(businessSlugs)) {
    const business = await prisma.business.findUnique({ where: { phone } })
    if (!business) {
      console.warn(`Business with phone ${phone} not found — run prisma/seed-businesses-vn.ts first. Skipping "${slug}".`)
      continue
    }

    const existing = await prisma.image.findMany({
      where: { businessId: business.businessId, imageType: { in: ['BUSINESS_LOGO', 'BUSINESS_COVER', 'BUSINESS_GALLERY'] } },
    })
    if (existing.length > 0) {
      console.log(`Business "${slug}" (id=${business.businessId}) already has images — skipping.`)
      continue
    }

    await prisma.image.create({
      data: {
        cloudinaryPublicId: `seed/${slug}-logo`,
        secureUrl: `https://picsum.photos/seed/${slug}-logo/400/400`,
        width: 400,
        height: 400,
        format: 'jpg',
        imageType: 'BUSINESS_LOGO',
        businessId: business.businessId,
      },
    })

    await prisma.image.create({
      data: {
        cloudinaryPublicId: `seed/${slug}-cover`,
        secureUrl: `https://picsum.photos/seed/${slug}-cover/1200/400`,
        width: 1200,
        height: 400,
        format: 'jpg',
        imageType: 'BUSINESS_COVER',
        businessId: business.businessId,
      },
    })

    for (let i = 1; i <= GALLERY_COUNT; i++) {
      await prisma.image.create({
        data: {
          cloudinaryPublicId: `seed/${slug}-gallery-${i}`,
          secureUrl: `https://picsum.photos/seed/${slug}-gallery-${i}/800/600`,
          width: 800,
          height: 600,
          format: 'jpg',
          imageType: 'BUSINESS_GALLERY',
          displayOrder: i,
          businessId: business.businessId,
        },
      })
    }

    console.log(`Seeded logo + cover + ${GALLERY_COUNT} gallery images for "${slug}" (id=${business.businessId})`)
  }

  console.log('Done seeding placeholder images.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
