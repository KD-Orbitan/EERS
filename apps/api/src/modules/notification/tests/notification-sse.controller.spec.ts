import { JwtService } from '@nestjs/jwt'
import { NotificationSseController } from '../presentation/sse/notification-sse.controller'
import { SseConnectionManager } from '../infrastructure/sse/sse-connection.manager'

describe('NotificationSseController', () => {
  let sseConnectionManager: SseConnectionManager
  let jwtService: jest.Mocked<Pick<JwtService, 'decode'>>
  let controller: NotificationSseController

  beforeEach(() => {
    jest.useFakeTimers()
    sseConnectionManager = new SseConnectionManager()
    jwtService = { decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 }) }
    controller = new NotificationSseController(sseConnectionManager, jwtService as unknown as JwtService)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const fakeRequest = () => ({ headers: { authorization: 'Bearer token' } }) as any

  it('sends a connection event immediately on subscribe', () => {
    const events: any[] = []
    const subscription = controller.stream({ userId: 3 }, fakeRequest()).subscribe((event) => events.push(event))

    expect(events).toHaveLength(1)
    expect(events[0].data).toMatchObject({ event: 'connection', connected: true })

    subscription.unsubscribe()
  })

  it('sends a heartbeat every 30 seconds', () => {
    const events: any[] = []
    const subscription = controller.stream({ userId: 3 }, fakeRequest()).subscribe((event) => events.push(event))

    jest.advanceTimersByTime(30000)

    expect(events).toHaveLength(2)
    expect(events[1].data).toMatchObject({ event: 'heartbeat' })

    subscription.unsubscribe()
  })

  it('sends a notification event pushed via the connection manager', () => {
    const events: any[] = []
    const subscription = controller.stream({ userId: 3 }, fakeRequest()).subscribe((event) => events.push(event))

    sseConnectionManager.push(3, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 'New reply', content: 'They replied' })

    expect(events).toHaveLength(2)
    expect(events[1].data).toEqual({ event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 'New reply', content: 'They replied' })

    subscription.unsubscribe()
  })

  it('unregisters the connection when unsubscribed', () => {
    const events: any[] = []
    const subscription = controller.stream({ userId: 3 }, fakeRequest()).subscribe((event) => events.push(event))
    subscription.unsubscribe()

    sseConnectionManager.push(3, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 'New reply', content: 'They replied' })

    expect(events).toHaveLength(1)
  })
})
