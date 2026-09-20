export abstract class RefreshTokenRepository {
  abstract create(data: {
    userId: number
    token: string
    expiresAt: Date
  }): Promise<unknown>

  abstract createWithLoginAudit(data: {
    userId: number
    token: string
    expiresAt: Date
  }): Promise<void>

  abstract findActiveTokensByUserId(userId: number): Promise<unknown[]>

  abstract revoke(tokenId: number): Promise<void>
}
