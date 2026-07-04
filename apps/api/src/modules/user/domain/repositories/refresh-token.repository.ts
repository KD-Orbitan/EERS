export abstract class RefreshTokenRepository {
  abstract revokeAllByUserId(userId: number): Promise<void>
}
