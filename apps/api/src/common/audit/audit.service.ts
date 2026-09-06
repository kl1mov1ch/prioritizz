import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ActorType } from '@prisma/client';

export interface AuditInput {
  actorType: ActorType;
  actorId?: string | null;
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  traceId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Write an audit row. Pass a tx client to keep it in the same transaction. */
  async record(input: AuditInput, tx?: Pick<PrismaService, 'auditLog'>): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        adminId: input.adminId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        before: (input.before ?? null) as any,
        after: (input.after ?? null) as any,
        ip: input.ip ?? null,
        traceId: input.traceId ?? null,
      },
    });
  }
}
