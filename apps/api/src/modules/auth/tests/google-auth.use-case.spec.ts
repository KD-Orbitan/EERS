import { ServiceUnavailableException } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { GoogleAuthUseCase } from '../application/use-cases/google-auth.use-case'
import { InvalidGoogleTokenException, UserBannedException } from '../domain/exceptions/auth.exceptions'

describe('GoogleAuthUseCase', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID
  const user = { userId: 1, name: 'Jane', email: 'jane@gmail.com', status: 'active', role: { roleName: 'USER' } }
  let users: { findByEmail: jest.Mock; findRoleByName: jest.Mock; create: jest.Mock }
  let tokens: { createWithLoginAudit: jest.Mock }
  let verify: jest.SpyInstance
  let useCase: GoogleAuthUseCase

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client'
    users = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findRoleByName: jest.fn().mockResolvedValue({ roleId: 2, roleName: 'USER' }),
      create: jest.fn().mockResolvedValue(user),
    }
    tokens = { createWithLoginAudit: jest.fn() }
    verify = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken')
    verify.mockResolvedValue({
      getPayload: () => ({ sub: 'google-user', email: user.email, email_verified: true, name: user.name }),
    } as any)
    useCase = new GoogleAuthUseCase(users as any, tokens as any, { sign: jest.fn().mockReturnValue('token') } as any, { hash: jest.fn().mockResolvedValue('hash') } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = originalClientId
  })

  it('verifies the audience and signs in an existing account with its role', async () => {
    users.findByEmail.mockResolvedValue({ ...user, role: { roleName: 'ADMIN' } })
    const result = await useCase.execute({ idToken: 'credential' })
    expect(verify).toHaveBeenCalledWith({ idToken: 'credential', audience: 'test-client' })
    expect(result.user.role).toBe('ADMIN')
    expect(users.create).not.toHaveBeenCalled()
    expect(tokens.createWithLoginAudit).toHaveBeenCalledWith({ userId: 1, token: 'hash', expiresAt: expect.any(Date) })
  })

  it('creates a USER account on first sign-in', async () => {
    users.findByEmail.mockResolvedValue(null)
    await expect(useCase.execute({ idToken: 'credential' })).resolves.toHaveProperty('accessToken', 'token')
    expect(users.create).toHaveBeenCalledWith({ name: 'Jane', email: user.email, password: 'hash', roleId: 2, status: 'active' })
  })

  it('rejects invalid or expired tokens without looking up a user', async () => {
    verify.mockRejectedValue(new Error('Invalid token'))
    await expect(useCase.execute({ idToken: 'bad' })).rejects.toBeInstanceOf(InvalidGoogleTokenException)
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it.each([
    undefined,
    { sub: '123', email: user.email, email_verified: false },
    { sub: '123', email: 'jane@example.com', email_verified: true },
    { email: user.email, email_verified: true },
  ])('rejects missing identity or email not authoritative for Google: %j', async (payload) => {
    verify.mockResolvedValue({ getPayload: () => payload })
    await expect(useCase.execute({ idToken: 'credential' })).rejects.toBeInstanceOf(InvalidGoogleTokenException)
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it('accepts verified Workspace emails', async () => {
    verify.mockResolvedValue({ getPayload: () => ({ sub: '123', email: 'jane@example.com', email_verified: true, hd: 'example.com' }) })
    await expect(useCase.execute({ idToken: 'credential' })).resolves.toHaveProperty('accessToken')
  })

  it('rejects banned accounts without creating a session', async () => {
    users.findByEmail.mockResolvedValue({ ...user, status: 'banned' })
    await expect(useCase.execute({ idToken: 'credential' })).rejects.toBeInstanceOf(UserBannedException)
    expect(tokens.createWithLoginAudit).not.toHaveBeenCalled()
  })

  it('fails closed without a configured client ID', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    await expect(useCase.execute({ idToken: 'credential' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(verify).not.toHaveBeenCalled()
  })

  it('does not create an account without the default role', async () => {
    users.findByEmail.mockResolvedValue(null)
    users.findRoleByName.mockResolvedValue(null)
    await expect(useCase.execute({ idToken: 'credential' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(users.create).not.toHaveBeenCalled()
  })
})
