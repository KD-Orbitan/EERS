import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { CreateBusinessDto } from '../../application/dto/create-business.dto'
import { UpdateBusinessDto } from '../../application/dto/update-business.dto'
import { CreateLocationDto } from '../../application/dto/create-location.dto'
import { UpdateLocationDto } from '../../application/dto/update-location.dto'
import { BusinessListQueryDto } from '../../application/dto/business-list-query.dto'
import { ReorderGalleryDto } from '../../application/dto/reorder-gallery.dto'
import { CreateBusinessUseCase } from '../../application/use-cases/create-business.use-case'
import { UpdateBusinessUseCase } from '../../application/use-cases/update-business.use-case'
import { DeleteBusinessUseCase } from '../../application/use-cases/delete-business.use-case'
import { GetBusinessListUseCase } from '../../application/use-cases/get-business-list.use-case'
import { GetBusinessByIdUseCase } from '../../application/use-cases/get-business-by-id.use-case'
import { GetMyBusinessesUseCase } from '../../application/use-cases/get-my-businesses.use-case'
import { GetBusinessStatisticsUseCase } from '../../application/use-cases/get-business-statistics.use-case'
import { AddLocationUseCase } from '../../application/use-cases/add-location.use-case'
import { UpdateLocationUseCase } from '../../application/use-cases/update-location.use-case'
import { RemoveLocationUseCase } from '../../application/use-cases/remove-location.use-case'
import { UploadCoverUseCase } from '../../application/use-cases/upload-cover.use-case'
import { DeleteCoverUseCase } from '../../application/use-cases/delete-cover.use-case'
import { UploadLogoUseCase } from '../../application/use-cases/upload-logo.use-case'
import { DeleteLogoUseCase } from '../../application/use-cases/delete-logo.use-case'
import { UploadGalleryUseCase } from '../../application/use-cases/upload-gallery.use-case'
import { DeleteGalleryImageUseCase } from '../../application/use-cases/delete-gallery-image.use-case'
import { ReorderGalleryUseCase } from '../../application/use-cases/reorder-gallery.use-case'
import { JwtService } from '@nestjs/jwt'

@ApiTags('businesses')
@Controller('businesses')
export class BusinessController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly createBusinessUseCase: CreateBusinessUseCase,
    private readonly updateBusinessUseCase: UpdateBusinessUseCase,
    private readonly deleteBusinessUseCase: DeleteBusinessUseCase,
    private readonly getBusinessListUseCase: GetBusinessListUseCase,
    private readonly getBusinessByIdUseCase: GetBusinessByIdUseCase,
    private readonly getMyBusinessesUseCase: GetMyBusinessesUseCase,
    private readonly getBusinessStatisticsUseCase: GetBusinessStatisticsUseCase,
    private readonly addLocationUseCase: AddLocationUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
    private readonly removeLocationUseCase: RemoveLocationUseCase,
    private readonly uploadCoverUseCase: UploadCoverUseCase,
    private readonly deleteCoverUseCase: DeleteCoverUseCase,
    private readonly uploadLogoUseCase: UploadLogoUseCase,
    private readonly deleteLogoUseCase: DeleteLogoUseCase,
    private readonly uploadGalleryUseCase: UploadGalleryUseCase,
    private readonly deleteGalleryImageUseCase: DeleteGalleryImageUseCase,
    private readonly reorderGalleryUseCase: ReorderGalleryUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createBusiness(@CurrentUser() user: { userId: number }, @Body() dto: CreateBusinessDto) {
    return this.createBusinessUseCase.execute({ userId: user.userId, dto })
  }

  @Get()
  async getBusinesses(@Query() query: BusinessListQueryDto) {
    const { items, total } = await this.getBusinessListUseCase.execute(query)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyBusinesses(@CurrentUser() user: { userId: number }, @Query() query: BusinessListQueryDto) {
    const { items, total } = await this.getMyBusinessesUseCase.execute({ userId: user.userId, page: query.page, limit: query.limit })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get(':businessId')
  async getBusinessById(@Param('businessId', ParseIntPipe) businessId: number, @Req() req: Request) {
    const currentUser = this.getOptionalUser(req)
    return this.getBusinessByIdUseCase.execute({ businessId, currentUser })
  }

  @Patch(':businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateBusiness(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.updateBusinessUseCase.execute({ businessId, user, dto })
  }

  @Delete(':businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteBusiness(@CurrentUser() user: { userId: number; role: string }, @Param('businessId', ParseIntPipe) businessId: number) {
    await this.deleteBusinessUseCase.execute({ businessId, user })
  }

  @Get(':businessId/statistics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getStatistics(@CurrentUser() user: { userId: number; role: string }, @Param('businessId', ParseIntPipe) businessId: number) {
    return this.getBusinessStatisticsUseCase.execute({ businessId, user })
  }

  @Post(':businessId/locations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async addLocation(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreateLocationDto,
  ) {
    return this.addLocationUseCase.execute({ businessId, user, dto })
  }

  @Patch(':businessId/locations/:locationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.updateLocationUseCase.execute({ businessId, user, locationId, dto })
  }

  @Delete(':businessId/locations/:locationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async removeLocation(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    await this.removeLocationUseCase.execute({ businessId, user, locationId })
  }

  @Post(':businessId/cover')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover'))
  async uploadCover(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadCoverUseCase.execute({ businessId, user, file })
  }

  @Delete(':businessId/cover')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCover(@CurrentUser() user: { userId: number; role: string }, @Param('businessId', ParseIntPipe) businessId: number) {
    await this.deleteCoverUseCase.execute({ businessId, user })
  }

  @Post(':businessId/logo')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadLogoUseCase.execute({ businessId, user, file })
  }

  @Delete(':businessId/logo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLogo(@CurrentUser() user: { userId: number; role: string }, @Param('businessId', ParseIntPipe) businessId: number) {
    await this.deleteLogoUseCase.execute({ businessId, user })
  }

  @Post(':businessId/gallery')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadGallery(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadGalleryUseCase.execute({ businessId, user, files })
  }

  @Delete(':businessId/gallery/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGalleryImage(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    await this.deleteGalleryImageUseCase.execute({ businessId, user, imageId })
  }

  @Patch(':businessId/gallery/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async reorderGallery(
    @CurrentUser() user: { userId: number; role: string },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: ReorderGalleryDto,
  ) {
    return this.reorderGalleryUseCase.execute({ businessId, user, imageIds: dto.imageIds })
  }

  private getOptionalUser(req: Request) {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined
    }
    const [scheme, token] = authHeader.split(' ')
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      return undefined
    }

    try {
      const payload = this.jwtService.verify(token) as { sub?: number; userId?: number; role?: string }
      if (typeof payload.sub === 'number') {
        return { userId: payload.sub, role: payload.role ?? 'USER' }
      }
      if (typeof payload.userId === 'number') {
        return { userId: payload.userId, role: payload.role ?? 'USER' }
      }
      return undefined
    } catch {
      return undefined
    }
  }
}
