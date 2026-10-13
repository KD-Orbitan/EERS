/** Fill missing map coordinates from an existing location in the same province.
 * Approximate demo points, NOT geocoding. Existing coordinates are preserved.
 * node --env-file=.env.production.local -r ts-node/register prisma/seed-demo-map-coordinates.ts [--apply]
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()
const scope: Prisma.LocationWhereInput = { businessLocations: { some: { business: { deletedAt: null } } } }
async function main() {
  const locations = await prisma.location.findMany({ where: scope, orderBy: { locationId: 'asc' }, select: { locationId: true, province: true, latitude: true, longitude: true, businessLocations: { select: { businessId: true } } } })
  const anchors = new Map<string, { latitude: number; longitude: number }>()
  for (const location of locations) {
    if (location.latitude !== null && location.longitude !== null && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180 && !anchors.has(location.province)) anchors.set(location.province, { latitude: Number(location.latitude), longitude: Number(location.longitude) })
  }
  const missing = locations.filter(location => location.latitude === null || location.longitude === null)
  const unknown = [...new Set(missing.filter(location => !anchors.has(location.province)).map(location => location.province))]
  if (unknown.length) throw new Error(`No same-province anchor for: ${unknown.join(', ')}`)
  const planned = missing.map(location => {
    const anchor = anchors.get(location.province)!
    const id = Number(location.locationId)
    return { location, latitude: location.latitude === null ? Number((anchor.latitude + ((id * 37 % 101) - 50) * 0.0002).toFixed(6)) : Number(location.latitude), longitude: location.longitude === null ? Number((anchor.longitude + ((id * 61 % 103) - 51) * 0.0002).toFixed(6)) : Number(location.longitude) }
  })
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'preview', missingLocations: planned.length, affectedBusinesses: new Set(planned.flatMap(item => item.location.businessLocations.map(b => String(b.businessId)))).size, provinces: [...new Set(missing.map(location => location.province))], preservedLocations: locations.length - missing.length }))
  if (!process.argv.includes('--apply')) return
  let updated = 0
  for (let start = 0; start < planned.length; start += 5) {
    const counts = await Promise.all(planned.slice(start, start + 5).map(item => prisma.$transaction(async tx => {
      const result = await tx.location.updateMany({ where: { locationId: item.location.locationId, latitude: item.location.latitude, longitude: item.location.longitude }, data: { latitude: item.latitude, longitude: item.longitude } })
      if (result.count) await tx.log.create({ data: { action: 'DEMO_MAP_COORDINATES_SEEDED', entityType: 'Location', entityId: item.location.locationId, oldData: { latitude: item.location.latitude === null ? null : Number(item.location.latitude), longitude: item.location.longitude === null ? null : Number(item.location.longitude) }, newData: { latitude: item.latitude, longitude: item.longitude, source: 'approximate-demo', province: item.location.province, note: 'Illustrative point near an existing same-province location, not a verified address.' } } })
      return result.count
    }, { maxWait: 10000, timeout: 20000 })))
    updated += counts.reduce((sum, count) => sum + count, 0)
  }
  const remainingMissing = await prisma.location.count({ where: { AND: [scope, { OR: [{ latitude: null }, { longitude: null }] }] } })
  console.log(JSON.stringify({ updated, remainingMissing }))
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Map seed failed'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
