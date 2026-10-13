import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { configureHttpApp } from '../src/configure-http-app'
import { AuthController } from '../src/modules/auth/presentation/controllers/auth.controller'
import { RegisterUseCase } from '../src/modules/auth/application/use-cases/register.use-case'
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case'
import { GoogleAuthUseCase } from '../src/modules/auth/application/use-cases/google-auth.use-case'
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case'
import { LogoutUseCase } from '../src/modules/auth/application/use-cases/logout.use-case'
import { InvalidCredentialsException, InvalidRefreshTokenException } from '../src/modules/auth/domain/exceptions/auth.exceptions'

// Real HTTP middleware, controller and DTOs; mocked application use cases.
// These tests do not require PostgreSQL, Redis, or an ML model.
describe('Authentication HTTP contract', () => {
  let app: INestApplication
  const login = { execute: jest.fn() }
  const register = { execute: jest.fn() }
  const refresh = { execute: jest.fn() }
  const logout = { execute: jest.fn() }
  const credentials = { email: 'customer@example.invalid', password: 'DemoPassword123!' }
  const originalPrefix = process.env.API_PREFIX

  beforeAll(async () => {
    process.env.API_PREFIX = 'api/v1'
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: login },
        { provide: RegisterUseCase, useValue: register },
        { provide: GoogleAuthUseCase, useValue: { execute: jest.fn() } },
        { provide: RefreshTokenUseCase, useValue: refresh },
        { provide: LogoutUseCase, useValue: logout },
      ],
    }).compile()
    app = module.createNestApplication()
    configureHttpApp(app)
    await app.init()
  })

  beforeEach(() => jest.resetAllMocks())

  afterAll(async () => {
    await app?.close()
    if (originalPrefix === undefined) delete process.env.API_PREFIX
    else process.env.API_PREFIX = originalPrefix
  })

  it('returns access tokens and stores refresh tokens only in an HttpOnly cookie', async () => {
    login.execute.mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 })
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send(credentials).expect(201)
    expect(response.body).toEqual({ success: true, data: { accessToken: 'access-token', expiresIn: 900 } })
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=refresh-token;')
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(login.execute).toHaveBeenCalledWith(credentials)
  })

  it.each([
    { email: 'invalid', password: 'password' },
    { email: credentials.email },
    { ...credentials, role: 'ADMIN' },
  ])('rejects invalid or unexpected login fields: %j', async (body) => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send(body).expect(400)
    expect(response.body.success).toBe(false)
    expect(login.execute).not.toHaveBeenCalled()
  })

  it('rejects privilege fields during public registration', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register')
      .send({ ...credentials, name: 'Customer', role: 'ADMIN' }).expect(400)
    expect(register.execute).not.toHaveBeenCalled()
  })

  it('preserves domain errors for invalid credentials', async () => {
    login.execute.mockRejectedValue(new InvalidCredentialsException())
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send(credentials).expect(401)
    expect(response.body).toEqual({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } })
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('reads refresh tokens from cookies', async () => {
    refresh.execute.mockResolvedValue({ accessToken: 'renewed-token' })
    const response = await request(app.getHttpServer()).post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=session-token').expect(201)
    expect(refresh.execute).toHaveBeenCalledWith('session-token')
    expect(response.body).toEqual({ success: true, data: { accessToken: 'renewed-token' } })
  })

  it('returns 401 when the use case rejects a missing refresh cookie', async () => {
    refresh.execute.mockRejectedValue(new InvalidRefreshTokenException())
    const response = await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401)
    expect(refresh.execute).toHaveBeenCalledWith(undefined)
    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN')
  })

  it('clears the browser cookie on logout', async () => {
    logout.execute.mockResolvedValue({ message: 'Logged out' })
    const response = await request(app.getHttpServer()).post('/api/v1/auth/logout')
      .set('Cookie', 'refreshToken=session-token').expect(201)
    expect(logout.execute).toHaveBeenCalledWith('session-token')
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=;')
    expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970')
  })

  it('does not expose unprefixed authentication routes', async () => {
    await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(404)
    expect(login.execute).not.toHaveBeenCalled()
  })
})
