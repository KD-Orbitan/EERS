import { Injectable, Logger } from '@nestjs/common'

import { Geocoder, type GeocodeResult } from '../../application/ports/geocoder.port'
export type { GeocodeResult } from '../../application/ports/geocoder.port'

// D-032: coordinates are best-effort and auto-geocoded server-side via
// OpenStreetMap's free Nominatim API (no API key, no billing) — never
// user-supplied, never block the caller on failure.
@Injectable()
export class GeocodingService extends Geocoder {
  private readonly logger = new Logger(GeocodingService.name)

  async geocode(address: string): Promise<GeocodeResult | null> {
    const trimmed = address.trim()
    if (!trimmed) {
      return null
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EERS-EnterpriseEvaluationRankingSystem/1.0' },
      })

      if (!response.ok) {
        this.logger.warn(`Geocoding request failed for "${trimmed}": HTTP ${response.status}`)
        return null
      }

      const results = (await response.json()) as Array<{ lat: string; lon: string }>
      if (!Array.isArray(results) || results.length === 0) {
        return null
      }

      const latitude = Number(results[0].lat)
      const longitude = Number(results[0].lon)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }

      return { latitude, longitude }
    } catch (error) {
      this.logger.warn(`Geocoding failed for "${trimmed}": ${(error as Error).message}`)
      return null
    }
  }
}
