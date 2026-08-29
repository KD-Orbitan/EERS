import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { SubmitClaimDto } from '../../application/dto/submit-claim.dto'
import { MyClaimsQueryDto } from '../../application/dto/my-claims-query.dto'
import { SubmitClaimUseCase } from '../../application/use-cases/submit-claim.use-case'
import { GetMyClaimsUseCase } from '../../application/use-cases/get-my-claims.use-case'
import { WithdrawClaimUseCase } from '../../application/use-cases/withdraw-claim.use-case'

@ApiTags('business-claims')
@ApiBearerAuth()
@Controller('business-claims')
@UseGuards(JwtAuthGuard)
export class BusinessClaimController {
  constructor(
    private readonly submitClaimUseCase: SubmitClaimUseCase,
    private readonly getMyClaimsUseCase: GetMyClaimsUseCase,
    private readonly withdrawClaimUseCase: WithdrawClaimUseCase,
  ) {}

  @Post()
  async submitClaim(@CurrentUser() user: { userId: number }, @Body() dto: SubmitClaimDto) {
    return this.submitClaimUseCase.execute({ currentUserId: user.userId, dto })
  }

  // Registered before :claimId — no dynamic route exists on this controller today, but
  // keep the static 'my' segment ahead of any future :claimId route (see docs/API.md
  // Business Claim APIs note).
  @Get('my')
  async getMyClaims(@CurrentUser() user: { userId: number }, @Query() query: MyClaimsQueryDto) {
    const { items, total } = await this.getMyClaimsUseCase.execute({ userId: user.userId, page: query.page, limit: query.limit })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Delete(':claimId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdrawClaim(@CurrentUser() user: { userId: number }, @Param('claimId', ParseIntPipe) claimId: number) {
    await this.withdrawClaimUseCase.execute({ claimId, currentUserId: user.userId })
  }
}
