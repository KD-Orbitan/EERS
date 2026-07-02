export abstract class RefreshTokenRepository {
  abstract create(data: {
    userId: number
    token: string
    expiresAt: Date
  }): Promise<unknown>

  abstract findActiveByToken(token: string): Promise<unknown>

  abstract revoke(tokenId: number): Promise<void>
}
