import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { LocationRepository } from '../../domain/repositories/location.repository'

@Injectable()
export class PrismaLocationRepository extends LocationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(locationId: number) {
    const location = await this.prisma.location.findUnique({ where: { locationId: BigInt(locationId) } })
    if (!location) {
      return null
    }
    return {
      locationId: Number(location.locationId),
      addressLine: location.addressLine,
      ward: location.ward,
      province: location.province,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }
  }

  async create(location: { addressLine: string; ward: string; province: string; latitude?: number | null; longitude?: number | null }) {
    const created = await this.prisma.location.create({
      data: {
        addressLine: location.addressLine,
        ward: location.ward,
        province: location.province,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
      },
    })
    return {
      locationId: Number(created.locationId),
      addressLine: created.addressLine,
      ward: created.ward,
      province: created.province,
      latitude: created.latitude ? Number(created.latitude) : null,
      longitude: created.longitude ? Number(created.longitude) : null,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  }

  async update(
    locationId: number,
    data: { addressLine?: string; ward?: string; province?: string; latitude?: number | null; longitude?: number | null },
  ) {
    await this.prisma.location.update({
      where: { locationId: BigInt(locationId) },
      data,
    })
    return { locationId }
  }

  async delete(locationId: number) {
    await this.prisma.location.delete({
      where: { locationId: BigInt(locationId) },
    })
  }

  async createBusinessLocation(businessId: number, locationId: number) {
    await this.prisma.businessLocation.create({
      data: {
        businessId: BigInt(businessId),
        locationId: BigInt(locationId),
      },
    })
  }

  async deleteBusinessLocation(businessId: number, locationId: number) {
    await this.prisma.businessLocation.delete({
      where: {
        businessId_locationId: {
          businessId: BigInt(businessId),
          locationId: BigInt(locationId),
        },
      },
    })
  }

  async createLocationWithBusinessJoin(businessId: number, location: { addressLine: string; ward: string; province: string }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const createdLocation = await tx.location.create({
        data: {
          addressLine: location.addressLine,
          ward: location.ward,
          province: location.province,
        },
      })
      await tx.businessLocation.create({
        data: {
          businessId: BigInt(businessId),
          locationId: createdLocation.locationId,
        },
      })
      return createdLocation
    })
    return { locationId: Number(result.locationId) }
  }

  async deleteLocationWithBusinessJoin(businessId: number, locationId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.businessLocation.delete({
        where: {
          businessId_locationId: {
            businessId: BigInt(businessId),
            locationId: BigInt(locationId),
          },
        },
      })
      await tx.location.delete({
        where: { locationId: BigInt(locationId) },
      })
    })
  }
}
