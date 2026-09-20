export interface GeocodeResult {
  latitude: number
  longitude: number
}

export abstract class Geocoder {
  abstract geocode(address: string): Promise<GeocodeResult | null>
}
