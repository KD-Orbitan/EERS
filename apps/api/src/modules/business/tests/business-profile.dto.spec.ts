import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateBusinessDto } from '../application/dto/create-business.dto'
import { UpdateBusinessDto } from '../application/dto/update-business.dto'

describe('Business profile validation', () => {
  const profile = {
    website: 'https://example.com', openingHours: 'Mon-Fri 08:00-18:00',
    services: 'Coffee and breakfast', priceRange: '30,000-100,000 VND', amenities: 'Wi-Fi, parking',
  }
  it('accepts optional profile details on creation', async () => {
    const dto = plainToInstance(CreateBusinessDto, {
      name: 'Cafe', phone: '0123456789', categoryIds: [1],
      locations: [{ addressLine: '123 Street', ward: 'Ward', province: 'Province' }], ...profile,
    })
    expect(await validate(dto)).toHaveLength(0)
  })
  it('allows clearing profile fields on edit', async () => {
    const dto = plainToInstance(UpdateBusinessDto, Object.fromEntries(Object.keys(profile).map(key => [key, ''])))
    expect(await validate(dto)).toHaveLength(0)
  })
  it.each(['javascript:alert(1)', 'ftp://example.com', 'example.com'])('rejects unsafe or incomplete website %s', async website => {
    expect((await validate(plainToInstance(UpdateBusinessDto, { website }))).map(error => error.property)).toContain('website')
  })
  it('limits article size on create and edit', async () => {
    for (const Dto of [CreateBusinessDto, UpdateBusinessDto]) {
      const dto = Object.assign(new Dto(), { description: 'x'.repeat(50001) })
      expect((await validate(dto)).map(error => error.property)).toContain('description')
    }
  })
  it('rejects oversized profile content', async () => {
    const dto = plainToInstance(UpdateBusinessDto, { services: 'x'.repeat(2001), openingHours: 'x'.repeat(1001), amenities: 'x'.repeat(1001), priceRange: 'x'.repeat(201) })
    expect(await validate(dto)).toHaveLength(4)
  })
})
