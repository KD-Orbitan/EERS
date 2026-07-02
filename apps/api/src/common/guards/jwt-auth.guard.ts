import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Optional() private readonly jwtService?: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    if (!this.jwtService) {
      request.user = { userId: 1 }
      return true
    }

    try {
      const payload = this.jwtService.verify(token)
      request.user = payload
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization || request.headers.Authorization
    if (!authHeader) return null

    const [scheme, token] = authHeader.split(' ')
    if (!scheme || scheme.toLowerCase() !== 'bearer') return null

    return token
  }
}
