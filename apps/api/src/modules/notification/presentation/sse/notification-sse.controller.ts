import { Controller, MessageEvent, Req, Sse, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { NEVER, Observable, interval, merge, of, timer } from 'rxjs'
import { finalize, map, takeUntil } from 'rxjs/operators'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { SseConnectionManager } from '../../infrastructure/sse/sse-connection.manager'

const HEARTBEAT_INTERVAL_MS = 30000

@Controller('notifications')
export class NotificationSseController {
  constructor(
    private readonly sseConnectionManager: SseConnectionManager,
    private readonly jwtService: JwtService,
  ) {}

  // Registered before :notificationId — see docs/API.md Chapter 10 note.
  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@CurrentUser() user: { userId: number }, @Req() request: Request): Observable<MessageEvent> {
    const subject = this.sseConnectionManager.register(user.userId)

    const connection$ = of<MessageEvent>({ data: { event: 'connection', connected: true, timestamp: new Date().toISOString() } })
    const heartbeat$ = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map<number, MessageEvent>(() => ({ data: { event: 'heartbeat', timestamp: new Date().toISOString() } })),
    )

    return merge(connection$, heartbeat$, subject.asObservable()).pipe(
      takeUntil(this.tokenExpiry$(request)),
      finalize(() => this.sseConnectionManager.unregister(user.userId, subject)),
    )
  }

  private tokenExpiry$(request: Request): Observable<unknown> {
    const authHeader = request.headers.authorization
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined
    if (!token) {
      return NEVER
    }

    const decoded = this.jwtService.decode(token) as { exp?: number } | null
    if (!decoded?.exp) {
      return NEVER
    }

    const msUntilExpiry = decoded.exp * 1000 - Date.now()
    return timer(Math.max(msUntilExpiry, 0))
  }
}
