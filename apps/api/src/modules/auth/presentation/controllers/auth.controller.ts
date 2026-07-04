import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import type { Response, Request } from 'express'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RegisterDto } from '../../application/dto/register.dto'
import { LoginDto } from '../../application/dto/login.dto'
import { GoogleAuthDto } from '../../application/dto/google-auth.dto'
import { RegisterUseCase } from '../../application/use-cases/register.use-case'
import { LoginUseCase } from '../../application/use-cases/login.use-case'
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case'
import { LogoutUseCase } from '../../application/use-cases/logout.use-case'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUseCase.execute(dto)
    const { refreshToken, ...response } = result as any
    res.cookie('refreshToken', refreshToken || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return response
  }

  @Post('google')
  async google(@Body() dto: GoogleAuthDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.googleAuthUseCase.execute(dto)
    const { refreshToken, ...response } = result as any
    res.cookie('refreshToken', refreshToken || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return response
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    return this.refreshTokenUseCase.execute(req.cookies?.refreshToken)
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.logoutUseCase.execute(req.cookies?.refreshToken)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })
    return result
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return user
  }
}
