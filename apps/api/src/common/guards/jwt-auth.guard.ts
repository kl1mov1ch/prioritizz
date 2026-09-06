import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { jwtAccessPayloadSchema } from '@prioritizz/schemas';
import { ERROR_CODES } from '@prioritizz/constants';
import { loadEnv } from '@prioritizz/config';
import { AppException } from '../errors/app-exception';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly env = loadEnv();

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppException(ERROR_CODES.AUTH_TOKEN_INVALID, 'Missing bearer token');
    }
    const token = header.slice(7);

    let raw: unknown;
    try {
      raw = await this.jwt.verifyAsync(token, { secret: this.env.JWT_ACCESS_SECRET });
    } catch {
      throw new AppException(ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Access token invalid or expired');
    }

    const payload = jwtAccessPayloadSchema.safeParse(raw);
    if (!payload.success) {
      throw new AppException(ERROR_CODES.AUTH_TOKEN_INVALID, 'Malformed token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.data.sid },
      select: { id: true, revokedAt: true, expiresAt: true, isAdminSession: true, userId: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppException(ERROR_CODES.AUTH_SESSION_REVOKED, 'Session no longer valid');
    }

    (req as any).authContext = {
      userId: payload.data.sub,
      sessionId: session.id,
      roles: payload.data.roles,
      isAdminSession: session.isAdminSession,
    };
    return true;
  }
}
