import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { CreateReportDto } from '../../application/dto/create-report.dto'
import { MyReportsQueryDto } from '../../application/dto/my-reports-query.dto'
import { GetReasonsUseCase } from '../../application/use-cases/get-reasons.use-case'
import { CreateReportUseCase } from '../../application/use-cases/create-report.use-case'
import { GetMyReportsUseCase } from '../../application/use-cases/get-my-reports.use-case'
import { GetReportByIdUseCase } from '../../application/use-cases/get-report-by-id.use-case'
import { WithdrawReportUseCase } from '../../application/use-cases/withdraw-report.use-case'

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    private readonly getReasonsUseCase: GetReasonsUseCase,
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly getMyReportsUseCase: GetMyReportsUseCase,
    private readonly getReportByIdUseCase: GetReportByIdUseCase,
    private readonly withdrawReportUseCase: WithdrawReportUseCase,
  ) {}

  // Registered before :reportId — see docs/API.md Chapter 8 note.
  @Get('reasons')
  async getReasons() {
    return this.getReasonsUseCase.execute()
  }

  @Post()
  async createReport(@CurrentUser() user: { userId: number }, @Body() dto: CreateReportDto) {
    return this.createReportUseCase.execute({ currentUserId: user.userId, dto })
  }

  // Registered before :reportId — see docs/API.md Chapter 8 note.
  @Get('my')
  async getMyReports(@CurrentUser() user: { userId: number }, @Query() query: MyReportsQueryDto) {
    const { items, total } = await this.getMyReportsUseCase.execute({ userId: user.userId, page: query.page, limit: query.limit })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get(':reportId')
  async getReportById(@CurrentUser() user: { userId: number; role: string }, @Param('reportId', ParseIntPipe) reportId: number) {
    return this.getReportByIdUseCase.execute({ reportId, currentUserId: user.userId, currentUserRole: user.role })
  }

  @Delete(':reportId')
  async withdrawReport(@CurrentUser() user: { userId: number }, @Param('reportId', ParseIntPipe) reportId: number) {
    await this.withdrawReportUseCase.execute({ reportId, currentUserId: user.userId })
  }
}
