import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { loadEnv } from '@prioritizz/config';
import type { TokenPair } from '@prioritizz/schemas';

@Injectable()
export class TokenService {
  private readonly env = loadEnv();

  constructor(private readonly jwt: JwtService) {}

  async issueAccessToken(input: {
    userId: string;
    sessionId: string;
    roles: string[];
  }): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.env.JWT_ACCESS_TTL * 1000);
    const token = await this.jwt.signAsync(
      { sub: input.userId, sid: input.sessionId, roles: input.roles, typ: 'access' },
      { secret: this.env.JWT_ACCESS_SECRET, expiresIn: this.env.JWT_ACCESS_TTL },
    );
    return { token, expiresAt };
  }

  /** Opaque, high-entropy refresh token. Only its sha256 hash is stored. */
  createRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');
    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + this.env.JWT_REFRESH_TTL * 1000),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async buildPair(input: {
    userId: string;
    sessionId: string;
    roles: string[];
  }): Promise<{ pair: TokenPair; refreshHash: string; refreshExpiresAt: Date }> {
    const access = await this.issueAccessToken(input);
    const refresh = this.createRefreshToken();
    return {
      pair: {
        accessToken: access.token,
        refreshToken: refresh.token,
        accessTokenExpiresAt: access.expiresAt.toISOString(),
        refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      },
      refreshHash: refresh.hash,
      refreshExpiresAt: refresh.expiresAt,
    };
  }
}
