// One-off script: geocode every existing Location row missing coordinates.
// Not part of seed.ts (that must stay deterministic/offline) — run manually:
//   pnpm --filter api exec ts-node prisma/backfill-location-coordinates.ts
// Respects Nominatim's 1 request/second usage policy (see docs/DECISIONS.md D-032).
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    const response = await fetch(url, { headers: { 'User-Agent': 'EERS-EnterpriseEvaluationRankingSystem/1.0' } })
    if (!response.ok) return null
    const results = (await response.json()) as Array<{ lat: string; lon: string }>
    if (!Array.isArray(results) || results.length === 0) return null
    const latitude = Number(results[0].lat)
    const longitude = Number(results[0].lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    return { latitude, longitude }
  } catch (error) {
    console.warn(`Geocoding failed for "${address}": ${(error as Error).message}`)
    return null
  }
}

async function main() {
  const locations = await prisma.location.findMany({ where: { latitude: null } })
  console.log(`Found ${locations.length} location(s) missing coordinates.`)

  let geocoded = 0
  for (const location of locations) {
    const address = `${location.addressLine}, ${location.ward}, ${location.province}`
    const coords = await geocode(address)
    if (coords) {
      await prisma.location.update({
        where: { locationId: location.locationId },
        data: { latitude: coords.latitude, longitude: coords.longitude },
      })
      geocoded += 1
      console.log(`Geocoded location ${location.locationId} ("${address}") -> ${coords.latitude}, ${coords.longitude}`)
    } else {
      console.log(`No geocode result for location ${location.locationId} ("${address}")`)
    }
    await sleep(1100)
  }

  console.log(`Done. Geocoded ${geocoded}/${locations.length} location(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
