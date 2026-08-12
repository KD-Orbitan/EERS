import { SseConnectionManager } from '../infrastructure/sse/sse-connection.manager'

describe('SseConnectionManager', () => {
  let manager: SseConnectionManager

  beforeEach(() => {
    manager = new SseConnectionManager()
  })

  it('delivers pushed events to the registered subject for that user', () => {
    const subject = manager.register(3)
    const received: any[] = []
    const subscription = subject.subscribe((event) => received.push(event))

    manager.push(3, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 't', content: 'c' })

    expect(received).toEqual([{ data: { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 't', content: 'c' } }])
    subscription.unsubscribe()
  })

  it('silently ignores pushes to a user with no active connection', () => {
    expect(() => manager.push(999, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 't', content: 'c' })).not.toThrow()
  })

  it('stops delivering events after unregister', () => {
    const subject = manager.register(3)
    const received: any[] = []
    const subscription = subject.subscribe((event) => received.push(event))

    manager.unregister(3, subject)
    manager.push(3, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 't', content: 'c' })

    expect(received).toEqual([])
    subscription.unsubscribe()
  })

  it('does not unregister a newer connection when an older subject reference is passed', () => {
    const oldSubject = manager.register(3)
    const newSubject = manager.register(3)
    const received: any[] = []
    const subscription = newSubject.subscribe((event) => received.push(event))

    manager.unregister(3, oldSubject)
    manager.push(3, { event: 'notification', notificationId: 1, type: 'NEW_REPLY', title: 't', content: 'c' })

    expect(received).toHaveLength(1)
    subscription.unsubscribe()
  })
})
