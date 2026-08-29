import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { BusinessController } from './presentation/controllers/business.controller'
import { BusinessRepository } from './domain/repositories/business.repository'
import { LocationRepository } from './domain/repositories/location.repository'
import { BusinessImageRepository } from './domain/repositories/business-image.repository'
import { PrismaBusinessRepository } from './infrastructure/repositories/prisma-business.repository'
import { PrismaLocationRepository } from './infrastructure/repositories/prisma-location.repository'
import { PrismaBusinessImageRepository } from './infrastructure/repositories/prisma-business-image.repository'
import { GeocodingService } from './infrastructure/services/geocoding.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CreateBusinessUseCase } from './application/use-cases/create-business.use-case'
import { CreateBusinessAsAdminUseCase } from './application/use-cases/create-business-as-admin.use-case'
import { UpdateBusinessUseCase } from './application/use-cases/update-business.use-case'
import { DeleteBusinessUseCase } from './application/use-cases/delete-business.use-case'
import { GetBusinessListUseCase } from './application/use-cases/get-business-list.use-case'
import { GetBusinessByIdUseCase } from './application/use-cases/get-business-by-id.use-case'
import { GetBusinessSummaryUseCase } from './application/use-cases/get-business-summary.use-case'
import { GetMyBusinessesUseCase } from './application/use-cases/get-my-businesses.use-case'
import { GetBusinessStatisticsUseCase } from './application/use-cases/get-business-statistics.use-case'
import { GetBusinessReviewTrendUseCase } from './application/use-cases/get-business-review-trend.use-case'
import { AddLocationUseCase } from './application/use-cases/add-location.use-case'
import { UpdateLocationUseCase } from './application/use-cases/update-location.use-case'
import { RemoveLocationUseCase } from './application/use-cases/remove-location.use-case'
import { ValidateBusinessOwnershipUseCase } from './application/use-cases/validate-business-ownership.use-case'
import { UploadCoverUseCase } from './application/use-cases/upload-cover.use-case'
import { DeleteCoverUseCase } from './application/use-cases/delete-cover.use-case'
import { UploadLogoUseCase } from './application/use-cases/upload-logo.use-case'
import { DeleteLogoUseCase } from './application/use-cases/delete-logo.use-case'
import { UploadGalleryUseCase } from './application/use-cases/upload-gallery.use-case'
import { DeleteGalleryImageUseCase } from './application/use-cases/delete-gallery-image.use-case'
import { ReorderGalleryUseCase } from './application/use-cases/reorder-gallery.use-case'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [BusinessController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: BusinessRepository,
      useClass: PrismaBusinessRepository,
    },
    {
      provide: LocationRepository,
      useClass: PrismaLocationRepository,
    },
    {
      provide: BusinessImageRepository,
      useClass: PrismaBusinessImageRepository,
    },
    GeocodingService,
    CreateBusinessUseCase,
    CreateBusinessAsAdminUseCase,
    UpdateBusinessUseCase,
    DeleteBusinessUseCase,
    GetBusinessListUseCase,
    GetBusinessByIdUseCase,
    GetBusinessSummaryUseCase,
    GetMyBusinessesUseCase,
    GetBusinessStatisticsUseCase,
    GetBusinessReviewTrendUseCase,
    AddLocationUseCase,
    UpdateLocationUseCase,
    RemoveLocationUseCase,
    ValidateBusinessOwnershipUseCase,
    UploadCoverUseCase,
    DeleteCoverUseCase,
    UploadLogoUseCase,
    DeleteLogoUseCase,
    UploadGalleryUseCase,
    DeleteGalleryImageUseCase,
    ReorderGalleryUseCase,
  ],
  exports: [GetBusinessByIdUseCase, GetBusinessSummaryUseCase, ValidateBusinessOwnershipUseCase, BusinessRepository, CreateBusinessAsAdminUseCase],
})
export class BusinessModule {}
