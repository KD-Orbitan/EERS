import { GeocodingService } from '../infrastructure/services/geocoding.service'

describe('GeocodingService', () => {
  let service: GeocodingService
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    service = new GeocodingService()
    fetchSpy = jest.spyOn(global, 'fetch' as any)
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns coordinates parsed from a successful Nominatim response', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '21.028511', lon: '105.804817' }],
    } as any)

    const result = await service.geocode('1 Main St, Ward 1, Hanoi')

    expect(result).toEqual({ latitude: 21.028511, longitude: 105.804817 })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': expect.any(String) }) }),
    )
  })

  it('returns null when Nominatim finds no results', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: async () => [] } as any)

    const result = await service.geocode('a nonexistent address')

    expect(result).toBeNull()
  })

  it('returns null when the HTTP response is not ok', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 503 } as any)

    const result = await service.geocode('1 Main St')

    expect(result).toBeNull()
  })

  it('returns null and does not throw on network error', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'))

    const result = await service.geocode('1 Main St')

    expect(result).toBeNull()
  })

  it('returns null for a blank address without calling fetch', async () => {
    const result = await service.geocode('   ')

    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
