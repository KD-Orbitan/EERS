import { Body, Controller, Delete, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { UpdateReplyDto } from '../../application/dto/update-reply.dto'
import { UpdateReplyUseCase } from '../../application/use-cases/update-reply.use-case'
import { DeleteReplyUseCase } from '../../application/use-cases/delete-reply.use-case'

@ApiTags('replies')
@Controller('replies')
export class ReplyController {
  constructor(
    private readonly updateReplyUseCase: UpdateReplyUseCase,
    private readonly deleteReplyUseCase: DeleteReplyUseCase,
  ) {}

  @Patch(':replyId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS_OWNER', 'ADMIN')
  async updateReply(@CurrentUser() user: { userId: number; role: string }, @Param('replyId', ParseIntPipe) replyId: number, @Body() dto: UpdateReplyDto) {
    return this.updateReplyUseCase.execute({ replyId, currentUserId: user.userId, currentUserRole: user.role, content: dto.content })
  }

  @Delete(':replyId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS_OWNER', 'ADMIN')
  async deleteReply(@CurrentUser() user: { userId: number; role: string }, @Param('replyId', ParseIntPipe) replyId: number) {
    await this.deleteReplyUseCase.execute({ replyId, currentUserId: user.userId, currentUserRole: user.role })
  }
}
