import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { RejectBusinessDto } from '../../application/dto/reject-business.dto'
import { RejectReviewDto } from '../../application/dto/reject-review.dto'
import { UpdateScoringConfigDto } from '../../application/dto/update-scoring-config.dto'
import { UpdateCriterionWeightDto } from '../../application/dto/update-criterion-weight.dto'
import { UpdateRankingTrendConfigDto } from '../../application/dto/update-ranking-trend-config.dto'
import { AdminBusinessListQueryDto } from '../../application/dto/admin-business-list-query.dto'
import { AdminReviewListQueryDto } from '../../application/dto/admin-review-list-query.dto'
import { AdminUserListQueryDto } from '../../application/dto/admin-user-list-query.dto'
import { BanUserDto } from '../../application/dto/ban-user.dto'
import { CreateCategoryDto } from '../../application/dto/create-category.dto'
import { CreateCriterionDto } from '../../application/dto/create-criterion.dto'
import { ApproveBusinessUseCase } from '../../application/use-cases/approve-business.use-case'
import { RejectBusinessUseCase } from '../../application/use-cases/reject-business.use-case'
import { ListAdminBusinessesUseCase } from '../../application/use-cases/list-admin-businesses.use-case'
import { ApproveReviewUseCase } from '../../application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from '../../application/use-cases/reject-review.use-case'
import { ListAdminReviewsUseCase } from '../../application/use-cases/list-admin-reviews.use-case'
import { ScoringConfigUseCase } from '../../application/use-cases/scoring-config.use-case'
import { CriterionWeightUseCase } from '../../application/use-cases/criterion-weight.use-case'
import { RankingTrendConfigUseCase } from '../../application/use-cases/ranking-trend-config.use-case'
import { ListAdminUsersUseCase } from '../../application/use-cases/list-admin-users.use-case'
import { BanUserUseCase } from '../../application/use-cases/ban-user.use-case'
import { UnbanUserUseCase } from '../../application/use-cases/unban-user.use-case'
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case'
import { CreateCriterionUseCase } from '../../application/use-cases/create-criterion.use-case'
import { AssignCriterionUseCase } from '../../application/use-cases/assign-criterion.use-case'
import { RemoveCriterionUseCase } from '../../application/use-cases/remove-criterion.use-case'
import { TriggerRecalculationUseCase } from '../../../ranking/application/use-cases/trigger-recalculation.use-case'
import { AdminReportQueryDto } from '../../../report/application/dto/admin-report-query.dto'
import { ResolveReportDto } from '../../../report/application/dto/resolve-report.dto'
import { ListAdminReportsUseCase } from '../../../report/application/use-cases/list-admin-reports.use-case'
import { ResolveReportUseCase } from '../../../report/application/use-cases/resolve-report.use-case'
import { RejectReportUseCase } from '../../../report/application/use-cases/reject-report.use-case'
import { CreateBusinessDto } from '../../../business/application/dto/create-business.dto'
import { CreateBusinessAsAdminUseCase } from '../../../business/application/use-cases/create-business-as-admin.use-case'
import { AdminClaimQueryDto } from '../../../business-claim/application/dto/admin-claim-query.dto'
import { RejectClaimDto } from '../../../business-claim/application/dto/reject-claim.dto'
import { ListAdminClaimsUseCase } from '../../../business-claim/application/use-cases/list-admin-claims.use-case'
import { ApproveClaimUseCase } from '../../../business-claim/application/use-cases/approve-claim.use-case'
import { RejectClaimUseCase } from '../../../business-claim/application/use-cases/reject-claim.use-case'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly approveBusinessUseCase: ApproveBusinessUseCase,
    private readonly rejectBusinessUseCase: RejectBusinessUseCase,
    private readonly listAdminBusinessesUseCase: ListAdminBusinessesUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly rejectReviewUseCase: RejectReviewUseCase,
    private readonly listAdminReviewsUseCase: ListAdminReviewsUseCase,
    private readonly scoringConfigUseCase: ScoringConfigUseCase,
    private readonly criterionWeightUseCase: CriterionWeightUseCase,
    private readonly rankingTrendConfigUseCase: RankingTrendConfigUseCase,
    private readonly listAdminUsersUseCase: ListAdminUsersUseCase,
    private readonly banUserUseCase: BanUserUseCase,
    private readonly unbanUserUseCase: UnbanUserUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly createCriterionUseCase: CreateCriterionUseCase,
    private readonly assignCriterionUseCase: AssignCriterionUseCase,
    private readonly removeCriterionUseCase: RemoveCriterionUseCase,
    private readonly triggerRecalculationUseCase: TriggerRecalculationUseCase,
    private readonly listAdminReportsUseCase: ListAdminReportsUseCase,
    private readonly resolveReportUseCase: ResolveReportUseCase,
    private readonly rejectReportUseCase: RejectReportUseCase,
    private readonly createBusinessAsAdminUseCase: CreateBusinessAsAdminUseCase,
    private readonly listAdminClaimsUseCase: ListAdminClaimsUseCase,
    private readonly approveClaimUseCase: ApproveClaimUseCase,
    private readonly rejectClaimUseCase: RejectClaimUseCase,
  ) {}

  @Get('businesses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listBusinesses(@Query() query: AdminBusinessListQueryDto) {
    const { items, total } = await this.listAdminBusinessesUseCase.execute(query)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Post('businesses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createBusinessAsAdmin(@CurrentUser() user: { userId: number }, @Body() dto: CreateBusinessDto) {
    return this.createBusinessAsAdminUseCase.execute({ currentUserId: user.userId, dto })
  }

  @Post('businesses/:businessId/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveBusiness(@CurrentUser() user: { userId: number }, @Param('businessId', ParseIntPipe) businessId: number) {
    return this.approveBusinessUseCase.execute({ businessId, currentUserId: user.userId })
  }

  @Post('businesses/:businessId/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectBusiness(
    @CurrentUser() user: { userId: number },
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: RejectBusinessDto,
  ) {
    return this.rejectBusinessUseCase.execute({ businessId, currentUserId: user.userId, reason: dto.reason })
  }

  @Get('reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listReviews(@Query() query: AdminReviewListQueryDto) {
    const { items, total } = await this.listAdminReviewsUseCase.execute(query)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Post('reviews/:reviewId/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveReview(@CurrentUser() user: { userId: number }, @Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.approveReviewUseCase.execute({ reviewId, currentUserId: user.userId })
  }

  @Post('reviews/:reviewId/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectReview(
    @CurrentUser() user: { userId: number },
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: RejectReviewDto,
  ) {
    return this.rejectReviewUseCase.execute({ reviewId, currentUserId: user.userId, reason: dto.reason })
  }

  @Get('scoring-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getScoringConfig() {
    return this.scoringConfigUseCase.getConfig()
  }

  @Patch('scoring-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateScoringConfig(@Body() dto: UpdateScoringConfigDto) {
    const fraudSum = dto.fraudLambda1 + dto.fraudLambda2 + dto.fraudLambda3
    const weightSum = dto.weightAlpha + dto.weightBeta + dto.weightGamma
    const trustSum = dto.trustAlpha + dto.trustBeta + dto.trustGamma
    const tolerance = 0.001

    if (Math.abs(fraudSum - 1) > tolerance) {
      throw new Error('fraudLambda values must sum to 1')
    }
    if (Math.abs(weightSum - 1) > tolerance) {
      throw new Error('weightAlpha/weightBeta/weightGamma must sum to 1')
    }
    if (Math.abs(trustSum - 1) > tolerance) {
      throw new Error('trustAlpha/trustBeta/trustGamma must sum to 1')
    }

    await this.scoringConfigUseCase.updateConfig(dto)
    return { success: true }
  }

  @Get('criterion-weights/:categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getCriterionWeights(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.criterionWeightUseCase.getWeights(categoryId)
  }

  @Patch('criterion-weights/:categoryId/:criterionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCriterionWeight(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('criterionId', ParseIntPipe) criterionId: number,
    @Body() dto: UpdateCriterionWeightDto,
  ) {
    await this.criterionWeightUseCase.updateWeight(categoryId, criterionId, dto.weight)
    return { success: true }
  }

  @Post('rankings/recalculate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerRecalculation() {
    return this.triggerRecalculationUseCase.execute()
  }

  @Get('rankings/trend-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getRankingTrendConfig() {
    return this.rankingTrendConfigUseCase.getConfig()
  }

  @Patch('rankings/trend-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateRankingTrendConfig(@Body() dto: UpdateRankingTrendConfigDto) {
    return this.rankingTrendConfigUseCase.updateConfig(dto.period)
  }

  @Get('reports')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listReports(@Query() query: AdminReportQueryDto) {
    const { items, total } = await this.listAdminReportsUseCase.execute({ page: query.page, limit: query.limit, status: query.status })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Post('reports/:reportId/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async resolveReport(@Param('reportId', ParseIntPipe) reportId: number, @Body() _dto: ResolveReportDto) {
    return this.resolveReportUseCase.execute({ reportId })
  }

  @Post('reports/:reportId/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectReport(@Param('reportId', ParseIntPipe) reportId: number) {
    return this.rejectReportUseCase.execute({ reportId })
  }

  @Get('business-claims')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listBusinessClaims(@Query() query: AdminClaimQueryDto) {
    const { items, total } = await this.listAdminClaimsUseCase.execute({ page: query.page, limit: query.limit, status: query.status })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Post('business-claims/:claimId/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveBusinessClaim(@CurrentUser() user: { userId: number }, @Param('claimId', ParseIntPipe) claimId: number) {
    return this.approveClaimUseCase.execute({ claimId, currentUserId: user.userId })
  }

  @Post('business-claims/:claimId/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectBusinessClaim(
    @CurrentUser() user: { userId: number },
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() dto: RejectClaimDto,
  ) {
    return this.rejectClaimUseCase.execute({ claimId, currentUserId: user.userId, reason: dto.reason })
  }

  @Get('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listUsers(@Query() query: AdminUserListQueryDto) {
    const { items, total } = await this.listAdminUsersUseCase.execute(query)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Patch('users/:userId/ban')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async banUser(@CurrentUser() user: { userId: number }, @Param('userId', ParseIntPipe) userId: number, @Body() dto: BanUserDto) {
    return this.banUserUseCase.execute({ userId, currentUserId: user.userId, reason: dto.reason })
  }

  @Patch('users/:userId/unban')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async unbanUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.unbanUserUseCase.execute({ userId })
  }

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.createCategoryUseCase.execute(dto.categoryName)
  }

  @Post('criteria')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCriterion(@Body() dto: CreateCriterionDto) {
    return this.createCriterionUseCase.execute(dto.name, dto.description)
  }

  @Post('categories/:categoryId/criteria/:criterionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assignCriterion(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('criterionId', ParseIntPipe) criterionId: number,
  ) {
    return this.assignCriterionUseCase.execute(categoryId, criterionId)
  }

  @Delete('categories/:categoryId/criteria/:criterionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCriterion(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('criterionId', ParseIntPipe) criterionId: number,
  ) {
    await this.removeCriterionUseCase.execute(categoryId, criterionId)
  }
}
