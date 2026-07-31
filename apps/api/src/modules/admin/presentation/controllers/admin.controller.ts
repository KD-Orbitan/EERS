import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { RejectBusinessDto } from '../../application/dto/reject-business.dto'
import { RejectReviewDto } from '../../application/dto/reject-review.dto'
import { UpdateScoringConfigDto } from '../../application/dto/update-scoring-config.dto'
import { UpdateCriterionWeightDto } from '../../application/dto/update-criterion-weight.dto'
import { ApproveBusinessUseCase } from '../../application/use-cases/approve-business.use-case'
import { RejectBusinessUseCase } from '../../application/use-cases/reject-business.use-case'
import { ApproveReviewUseCase } from '../../application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from '../../application/use-cases/reject-review.use-case'
import { ScoringConfigUseCase } from '../../application/use-cases/scoring-config.use-case'
import { CriterionWeightUseCase } from '../../application/use-cases/criterion-weight.use-case'
import { TriggerRecalculationUseCase } from '../../../ranking/application/use-cases/trigger-recalculation.use-case'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly approveBusinessUseCase: ApproveBusinessUseCase,
    private readonly rejectBusinessUseCase: RejectBusinessUseCase,
    private readonly approveReviewUseCase: ApproveReviewUseCase,
    private readonly rejectReviewUseCase: RejectReviewUseCase,
    private readonly scoringConfigUseCase: ScoringConfigUseCase,
    private readonly criterionWeightUseCase: CriterionWeightUseCase,
    private readonly triggerRecalculationUseCase: TriggerRecalculationUseCase,
  ) {}

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
}
