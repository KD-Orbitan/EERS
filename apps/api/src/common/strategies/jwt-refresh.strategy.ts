import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.refreshToken || null,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') || 'change-me-refresh-secret',
    })
  }

  async validate(payload: any) {
    return { userId: payload.sub }
  }
}
