import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { UpdateProfileDto } from '../../application/dto/update-profile.dto'
import { ChangePasswordDto } from '../../application/dto/change-password.dto'
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case'
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case'
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case'
import { UploadAvatarUseCase } from '../../application/use-cases/upload-avatar.use-case'

@ApiTags('user')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { userId: number }) {
    return this.getUserProfileUseCase.execute(user.userId)
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() user: { userId: number }, @Body() dto: UpdateProfileDto) {
    return this.updateProfileUseCase.execute({ userId: user.userId, dto })
  }

  @Patch('change-password')
  async changePassword(@CurrentUser() user: { userId: number }, @Body() dto: ChangePasswordDto) {
    return this.changePasswordUseCase.execute({ userId: user.userId, dto })
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@CurrentUser() user: { userId: number }, @UploadedFile() file: Express.Multer.File) {
    return this.uploadAvatarUseCase.execute({ userId: user.userId, file })
  }
}
