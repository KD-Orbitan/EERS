import { Injectable, Logger } from '@nestjs/common'
import { Subject } from 'rxjs'
import { MessageEvent } from '@nestjs/common'

import { NotificationPublisher, type NotificationEvent } from '../../application/ports/notification-publisher.port'
export type NotificationSseEvent = NotificationEvent

@Injectable()
export class SseConnectionManager extends NotificationPublisher {
  private readonly logger = new Logger(SseConnectionManager.name)
  private readonly connections = new Map<number, Subject<MessageEvent>>()

  register(userId: number): Subject<MessageEvent> {
    const subject = new Subject<MessageEvent>()
    this.connections.set(userId, subject)
    return subject
  }

  unregister(userId: number, subject: Subject<MessageEvent>): void {
    if (this.connections.get(userId) === subject) {
      this.connections.delete(userId)
    }
  }

  push(userId: number, event: NotificationSseEvent): void {
    const subject = this.connections.get(userId)
    if (!subject) {
      return
    }

    try {
      subject.next({ data: event })
    } catch (error) {
      this.logger.warn(`Failed to push SSE event to user ${userId}: ${(error as Error).message}`)
    }
  }
}
