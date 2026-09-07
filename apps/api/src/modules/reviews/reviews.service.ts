import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@prioritizz/constants';
import type { CreateReviewInput, ReviewListQuery, SellerReplyInput } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A review is one-per-order, only by the buyer, only once the order is
   * COMPLETED. Creating it recomputes the service and seller aggregates in the
   * same transaction so `ratingAvg`/`ratingCount` are never stale.
   */
  async create(userId: string, input: CreateReviewInput) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId, buyerId: userId },
        select: { id: true, status: true, serviceId: true, sellerId: true },
      });
      if (!order) throw AppException.notFound('Order', input.orderId);
      if (order.status !== 'COMPLETED') {
        throw new AppException(
          ERROR_CODES.ORDER_INVALID_TRANSITION,
          'You can review an order only after it is completed',
        );
      }

      const existing = await tx.review.findUnique({ where: { orderId: order.id } });
      if (existing) throw AppException.conflict('This order already has a review');

      const review = await tx.review.create({
        data: {
          orderId: order.id,
          serviceId: order.serviceId,
          sellerId: order.sellerId,
          authorId: userId,
          rating: input.rating,
          text: input.text ?? null,
        },
      });

      await this.recompute(tx, order.serviceId, order.sellerId);
      return this.serialize(review, { name: 'You', photoUrl: null });
    });
  }

  async listByService(query: ReviewListQuery) {
    return this.paged({ serviceId: query.serviceId, isHidden: false, deletedAt: null }, query);
  }

  async listBySeller(query: ReviewListQuery) {
    return this.paged({ sellerId: query.sellerId, isHidden: false, deletedAt: null }, query);
  }

  async summaryForService(serviceId: string) {
    return this.summary({ serviceId, isHidden: false, deletedAt: null });
  }

  async summaryForSeller(sellerId: string) {
    return this.summary({ sellerId, isHidden: false, deletedAt: null });
  }

  /** Seller answers a review on one of their own listings. */
  async reply(userId: string, reviewId: string, input: SellerReplyInput) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, seller: { userId } },
    });
    if (!review) throw AppException.notFound('Review', reviewId);

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { sellerReply: input.text },
      include: { author: { select: { firstName: true, lastName: true, photoUrl: true } } },
    });
    return this.serialize(updated, {
      name: fullName(updated.author),
      photoUrl: updated.author.photoUrl,
    });
  }

  // ---- internals ----

  private async paged(where: Prisma.ReviewWhereInput, query: ReviewListQuery) {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: { author: { select: { firstName: true, lastName: true, photoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((r) =>
        this.serialize(r, { name: fullName(r.author), photoUrl: r.author.photoUrl }),
      ),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  private async summary(where: Prisma.ReviewWhereInput) {
    const rows = await this.prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
    });
    const histogram: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let count = 0;
    let sum = 0;
    for (const r of rows) {
      histogram[String(r.rating)] = r._count.rating;
      count += r._count.rating;
      sum += r.rating * r._count.rating;
    }
    return { average: count ? Math.round((sum / count) * 100) / 100 : 0, count, histogram };
  }

  private async recompute(tx: Prisma.TransactionClient, serviceId: string, sellerId: string) {
    for (const [key, id] of [
      ['serviceId', serviceId],
      ['sellerId', sellerId],
    ] as const) {
      const agg = await tx.review.aggregate({
        where: { [key]: id, isHidden: false, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      });
      const ratingAvg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
      const ratingCount = agg._count.rating;
      if (key === 'serviceId') {
        await tx.service.update({ where: { id }, data: { ratingAvg, ratingCount } });
      } else {
        await tx.sellerProfile.update({ where: { id }, data: { ratingAvg, ratingCount } });
      }
    }
  }

  private serialize(
    r: {
      id: string;
      serviceId: string;
      sellerId: string;
      rating: number;
      text: string | null;
      sellerReply: string | null;
      createdAt: Date;
    },
    author: { name: string; photoUrl: string | null },
  ) {
    return {
      id: r.id,
      serviceId: r.serviceId,
      sellerId: r.sellerId,
      rating: r.rating,
      text: r.text,
      sellerReply: r.sellerReply,
      author,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

function fullName(u: { firstName: string | null; lastName: string | null }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'User';
}
