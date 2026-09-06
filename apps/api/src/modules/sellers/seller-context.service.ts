import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { ERROR_CODES } from '@prioritizz/constants';

@Injectable()
export class SellerContext {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the SellerProfile id for a user or throw 403. */
  async requireSellerId(userId: string): Promise<string> {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new AppException(ERROR_CODES.AUTH_FORBIDDEN_ROLE, 'Seller profile required');
    }
    return profile.id;
  }
}
