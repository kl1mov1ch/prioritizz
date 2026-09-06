import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Currency,
  LedgerAccountType,
  LedgerOwnerType,
  TransactionType,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ERROR_CODES } from '@prioritizz/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';

const D = Prisma.Decimal;

export interface PostingLeg {
  accountType: LedgerAccountType;
  ownerType: LedgerOwnerType;
  ownerId?: string | null;
  direction: 'DEBIT' | 'CREDIT';
  amount: Prisma.Decimal | string;
}

export interface PostingInput {
  currency: Currency;
  transactionType: TransactionType;
  orderId?: string | null;
  memo?: string;
  legs: PostingLeg[];
}

/**
 * Double-entry ledger. Every posting is balanced: sum(CREDIT) === sum(DEBIT).
 * Account balances are materialised in the same transaction.
 *
 * Sign convention: an account's balance increases on CREDIT and decreases on
 * DEBIT (liability-style). Platform/user balances are liabilities of the system
 * toward the user, so a seller earning money is a CREDIT to USER_PENDING.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async post(tx: Prisma.TransactionClient, input: PostingInput): Promise<string> {
    const groupId = randomUUID();
    let credit = new D(0);
    let debit = new D(0);
    for (const leg of input.legs) {
      const amt = new D(leg.amount);
      if (amt.lte(0)) throw AppException.validation('Ledger leg amount must be positive');
      if (leg.direction === 'CREDIT') credit = credit.add(amt);
      else debit = debit.add(amt);
    }
    if (!credit.equals(debit)) {
      throw new AppException(ERROR_CODES.LEDGER_UNBALANCED, 'Ledger posting is not balanced', {
        credit: credit.toString(),
        debit: debit.toString(),
      });
    }

    for (const leg of input.legs) {
      const account = await this.ensureAccount(tx, {
        type: leg.accountType,
        ownerType: leg.ownerType,
        ownerId: leg.ownerId ?? '',
        currency: input.currency,
      });
      const delta = leg.direction === 'CREDIT' ? new D(leg.amount) : new D(leg.amount).negated();

      await tx.ledgerEntry.create({
        data: {
          groupId,
          accountId: account.id,
          direction: leg.direction,
          currency: input.currency,
          amount: new D(leg.amount),
          orderId: input.orderId ?? null,
          transactionType: input.transactionType,
          memo: input.memo,
        },
      });
      await tx.ledgerAccount.update({
        where: { id: account.id },
        data: { balance: { increment: delta } },
      });
    }

    return groupId;
  }

  async balance(
    ownerType: LedgerOwnerType,
    ownerId: string,
    currency: Currency,
    type: LedgerAccountType,
  ): Promise<string> {
    const acc = await this.prisma.ledgerAccount.findUnique({
      where: { type_ownerType_ownerId_currency: { type, ownerType, ownerId, currency } },
    });
    return (acc?.balance ?? new D(0)).toString();
  }

  private async ensureAccount(
    tx: Prisma.TransactionClient,
    key: { type: LedgerAccountType; ownerType: LedgerOwnerType; ownerId: string; currency: Currency },
  ) {
    return tx.ledgerAccount.upsert({
      where: { type_ownerType_ownerId_currency: key },
      create: key,
      update: {},
    });
  }
}
