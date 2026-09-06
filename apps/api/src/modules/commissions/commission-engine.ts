import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { loadEnv } from '@prioritizz/config';
import type { CommissionMatcher, CommissionSnapshot } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';

const D = Prisma.Decimal;

export interface CommissionInput {
  grossAmount: Prisma.Decimal; // total charged to buyer, minus promo discount
  serviceKind: string;
  categoryId: string;
  sellerId: string;
  sellerTier: string;
  premiumDiscountBps?: number; // from an active seller subscription plan
  promoCode?: string;
}

/**
 * Resolves the single applicable CommissionRule and computes the fee.
 *
 * Precedence (most specific wins; ties broken by rule.priority ascending):
 *   SELLER  >  PROMO  >  CATEGORY  >  SERVICE_KIND  >  SELLER_TIER  >  GLOBAL
 */
@Injectable()
export class CommissionEngine {
  private readonly env = loadEnv();
  private static readonly SCOPE_RANK: Record<string, number> = {
    SELLER: 1,
    PROMO: 2,
    CATEGORY: 3,
    SERVICE_KIND: 4,
    SELLER_TIER: 5,
    GLOBAL: 6,
  };

  constructor(private readonly prisma: PrismaService) {}

  async resolve(input: CommissionInput): Promise<CommissionSnapshot> {
    const now = new Date();
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
        AND: [{ OR: [{ activeTo: null }, { activeTo: { gte: now } }] }],
      },
      orderBy: [{ priority: 'asc' }],
    });

    const matched = rules
      .filter((r) => this.matches(r.matcher as CommissionMatcher, input))
      .sort((a, b) => {
        const rank =
          (CommissionEngine.SCOPE_RANK[a.scope] ?? 99) -
          (CommissionEngine.SCOPE_RANK[b.scope] ?? 99);
        return rank !== 0 ? rank : a.priority - b.priority;
      });

    const rule = matched[0];
    const percentBps = rule?.percentBps ?? this.env.DEFAULT_COMMISSION_BPS;
    const fixed = rule ? new D(rule.fixed) : new D(0);
    const minFee = rule ? new D(rule.minFee) : new D(this.env.DEFAULT_MIN_FEE);
    const maxFee = rule?.maxFee ? new D(rule.maxFee) : null;
    const premiumDiscountBps = Math.min(input.premiumDiscountBps ?? 0, percentBps);

    const effectiveBps = Math.max(0, percentBps - premiumDiscountBps);
    let fee = input.grossAmount.mul(effectiveBps).div(10_000).add(fixed);
    if (fee.lt(minFee)) fee = minFee;
    if (maxFee && fee.gt(maxFee)) fee = maxFee;
    fee = fee.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    const sellerNet = input.grossAmount.sub(fee);

    return {
      ruleId: rule?.id ?? null,
      scope: rule?.scope ?? 'GLOBAL',
      percentBps: effectiveBps,
      fixed: fixed.toString(),
      minFee: minFee.toString(),
      computedFee: fee.toString(),
      sellerNetAmount: sellerNet.toString(),
      premiumDiscountBps,
    };
  }

  private matches(m: CommissionMatcher, input: CommissionInput): boolean {
    if (m.serviceKind && m.serviceKind !== input.serviceKind) return false;
    if (m.categoryId && m.categoryId !== input.categoryId) return false;
    if (m.sellerTier && m.sellerTier !== input.sellerTier) return false;
    if (m.sellerId && m.sellerId !== input.sellerId) return false;
    if (m.promoCode && m.promoCode !== input.promoCode) return false;
    return true;
  }
}
