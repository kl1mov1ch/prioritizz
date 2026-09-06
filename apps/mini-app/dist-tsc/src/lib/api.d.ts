export declare const api: {
  http: import('@prioritizz/api-client').HttpClient;
  auth: {
    telegram: (initData: string) => Promise<{
      user: {
        id: string;
        status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
        languageCode: string | null;
        roles: string[];
        isSeller: boolean;
      };
      tokens: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
        refreshTokenExpiresAt: string;
      };
    }>;
    refresh: (refreshToken: string) => Promise<{
      user: {
        id: string;
        status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
        languageCode: string | null;
        roles: string[];
        isSeller: boolean;
      };
      tokens: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
        refreshTokenExpiresAt: string;
      };
    }>;
    adminLogin: (input: import('@prioritizz/schemas').AdminLoginInput) => Promise<{
      user: {
        id: string;
        status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
        languageCode: string | null;
        roles: string[];
        isSeller: boolean;
      };
      tokens: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
        refreshTokenExpiresAt: string;
      };
    }>;
    logout: () => Promise<void>;
    sessions: () => Promise<{
      items: unknown[];
    }>;
  };
  me: {
    get: () => Promise<{
      id: string;
      status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
      createdAt: string;
      updatedAt: string;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
      languageCode: string | null;
      roles: string[];
      isSeller: boolean;
      buyerProfile: {
        completedOrders: number;
        disputeRate: number;
        premiumUntil: string | null;
      } | null;
      sellerProfile: {
        id: string;
        completedOrders: number;
        premiumUntil: string | null;
        displayName: string;
        tier: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER';
        ratingAvg: number;
        ratingCount: number;
        isVerified: boolean;
      } | null;
    }>;
    update: (input: import('@prioritizz/schemas').UpdateMeInput) => Promise<{
      id: string;
      status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
      createdAt: string;
      updatedAt: string;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
      languageCode: string | null;
      roles: string[];
      isSeller: boolean;
      buyerProfile: {
        completedOrders: number;
        disputeRate: number;
        premiumUntil: string | null;
      } | null;
      sellerProfile: {
        id: string;
        completedOrders: number;
        premiumUntil: string | null;
        displayName: string;
        tier: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER';
        ratingAvg: number;
        ratingCount: number;
        isVerified: boolean;
      } | null;
    }>;
    wallet: () => Promise<{
      currency: string;
      available: string;
      pending: string;
      inEscrow: string;
      lifetimeEarned: string;
      lifetimeSpent: string;
    }>;
    becomeSeller: (input: import('@prioritizz/schemas').BecomeSellerInput) => Promise<{
      id: string;
      status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
      createdAt: string;
      updatedAt: string;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
      languageCode: string | null;
      roles: string[];
      isSeller: boolean;
      buyerProfile: {
        completedOrders: number;
        disputeRate: number;
        premiumUntil: string | null;
      } | null;
      sellerProfile: {
        id: string;
        completedOrders: number;
        premiumUntil: string | null;
        displayName: string;
        tier: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER';
        ratingAvg: number;
        ratingCount: number;
        isVerified: boolean;
      } | null;
    }>;
  };
  catalog: {
    categories: () => Promise<import('@prioritizz/schemas').Category[]>;
    listServices: (query: Partial<import('@prioritizz/schemas').ServiceListQuery>) => Promise<{
      items: {
        id: string;
        title: string;
        status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
        description: string;
        currency: 'XTR' | 'USD' | 'EUR';
        createdAt: string;
        updatedAt: string;
        ratingAvg: number;
        ratingCount: number;
        slug: string;
        summary: string;
        kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
        deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
        basePriceAmount: string;
        slaHours: number;
        refundPolicy: string;
        terms: string | null;
        tags: string[];
        minQuantity: number;
        maxQuantity: number;
        variants: {
          name: string;
          id: string;
          isActive: boolean;
          priceAmount: string;
          isDefault: boolean;
          description?: string | undefined;
          stock?: number | null | undefined;
        }[];
        moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
        category: {
          name: string;
          id: string;
          slug: string;
        };
        seller: {
          id: string;
          displayName: string;
          tier: string;
          ratingAvg: number;
          isVerified: boolean;
        };
        media: {
          id: string;
          url: string;
          kind: string;
        }[];
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    getService: (idOrSlug: string) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
    createService: (input: import('@prioritizz/schemas').ServiceUpsertInput) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
    updateService: (
      id: string,
      input: import('@prioritizz/schemas').ServiceUpsertInput,
    ) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
    submitService: (id: string) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
    pauseService: (id: string) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
  };
  orders: {
    list: (query: { [x: string]: string | number | boolean | null | undefined }) => Promise<{
      items: {
        id: string;
        status:
          | 'DRAFT'
          | 'PENDING_PAYMENT'
          | 'PAID'
          | 'IN_ESCROW'
          | 'IN_PROGRESS'
          | 'DELIVERED'
          | 'COMPLETED'
          | 'CANCELED'
          | 'REFUNDED'
          | 'PARTIALLY_REFUNDED'
          | 'DISPUTED'
          | 'CHARGEBACK'
          | 'EXPIRED';
        currency: 'XTR' | 'USD' | 'EUR';
        createdAt: string;
        updatedAt: string;
        seller: {
          id: string;
          displayName: string;
        };
        quantity: number;
        buyerNote: string | null;
        sellerNetAmount: string;
        reference: string;
        paymentStatus:
          | 'CANCELED'
          | 'REFUNDED'
          | 'PARTIALLY_REFUNDED'
          | 'CHARGEBACK'
          | 'REQUIRES_PAYMENT'
          | 'PROCESSING'
          | 'SUCCEEDED'
          | 'FAILED';
        escrowStatus:
          | 'REFUNDED'
          | 'NONE'
          | 'HELD'
          | 'RELEASE_PENDING'
          | 'RELEASED'
          | 'REFUND_PENDING'
          | 'SPLIT'
          | 'FROZEN';
        grossAmount: string;
        discountAmount: string;
        totalAmount: string;
        commissionSnapshot: {
          fixed: string;
          ruleId: string | null;
          scope: string;
          percentBps: number;
          minFee: string;
          computedFee: string;
          sellerNetAmount: string;
          premiumDiscountBps: number;
        };
        autoReleaseAt: string | null;
        buyer: {
          id: string;
          displayName: string;
        };
        service: {
          id: string;
          title: string;
          kind: string;
          deliveryType: string;
        };
        deliveryPayload: string | null;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    get: (id: string) => Promise<{
      id: string;
      status:
        | 'DRAFT'
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_ESCROW'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'COMPLETED'
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'DISPUTED'
        | 'CHARGEBACK'
        | 'EXPIRED';
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        displayName: string;
      };
      quantity: number;
      buyerNote: string | null;
      sellerNetAmount: string;
      reference: string;
      paymentStatus:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      escrowStatus:
        | 'REFUNDED'
        | 'NONE'
        | 'HELD'
        | 'RELEASE_PENDING'
        | 'RELEASED'
        | 'REFUND_PENDING'
        | 'SPLIT'
        | 'FROZEN';
      grossAmount: string;
      discountAmount: string;
      totalAmount: string;
      commissionSnapshot: {
        fixed: string;
        ruleId: string | null;
        scope: string;
        percentBps: number;
        minFee: string;
        computedFee: string;
        sellerNetAmount: string;
        premiumDiscountBps: number;
      };
      autoReleaseAt: string | null;
      buyer: {
        id: string;
        displayName: string;
      };
      service: {
        id: string;
        title: string;
        kind: string;
        deliveryType: string;
      };
      deliveryPayload: string | null;
    }>;
    timeline: (id: string) => Promise<
      {
        type: string;
        id: string;
        message: string | null;
        createdAt: string;
        fromStatus: string | null;
        toStatus: string | null;
        actorType: 'SELLER' | 'ADMIN' | 'BUYER' | 'SYSTEM';
        actorId: string | null;
      }[]
    >;
    create: (
      input: import('@prioritizz/schemas').CreateOrderInput,
      idempotencyKey: string,
    ) => Promise<{
      id: string;
      status:
        | 'DRAFT'
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_ESCROW'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'COMPLETED'
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'DISPUTED'
        | 'CHARGEBACK'
        | 'EXPIRED';
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        displayName: string;
      };
      quantity: number;
      buyerNote: string | null;
      sellerNetAmount: string;
      reference: string;
      paymentStatus:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      escrowStatus:
        | 'REFUNDED'
        | 'NONE'
        | 'HELD'
        | 'RELEASE_PENDING'
        | 'RELEASED'
        | 'REFUND_PENDING'
        | 'SPLIT'
        | 'FROZEN';
      grossAmount: string;
      discountAmount: string;
      totalAmount: string;
      commissionSnapshot: {
        fixed: string;
        ruleId: string | null;
        scope: string;
        percentBps: number;
        minFee: string;
        computedFee: string;
        sellerNetAmount: string;
        premiumDiscountBps: number;
      };
      autoReleaseAt: string | null;
      buyer: {
        id: string;
        displayName: string;
      };
      service: {
        id: string;
        title: string;
        kind: string;
        deliveryType: string;
      };
      deliveryPayload: string | null;
    }>;
    cancel: (
      id: string,
      reason: string,
    ) => Promise<{
      id: string;
      status:
        | 'DRAFT'
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_ESCROW'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'COMPLETED'
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'DISPUTED'
        | 'CHARGEBACK'
        | 'EXPIRED';
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        displayName: string;
      };
      quantity: number;
      buyerNote: string | null;
      sellerNetAmount: string;
      reference: string;
      paymentStatus:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      escrowStatus:
        | 'REFUNDED'
        | 'NONE'
        | 'HELD'
        | 'RELEASE_PENDING'
        | 'RELEASED'
        | 'REFUND_PENDING'
        | 'SPLIT'
        | 'FROZEN';
      grossAmount: string;
      discountAmount: string;
      totalAmount: string;
      commissionSnapshot: {
        fixed: string;
        ruleId: string | null;
        scope: string;
        percentBps: number;
        minFee: string;
        computedFee: string;
        sellerNetAmount: string;
        premiumDiscountBps: number;
      };
      autoReleaseAt: string | null;
      buyer: {
        id: string;
        displayName: string;
      };
      service: {
        id: string;
        title: string;
        kind: string;
        deliveryType: string;
      };
      deliveryPayload: string | null;
    }>;
    deliver: (
      id: string,
      input: import('@prioritizz/schemas').OrderDeliverInput,
    ) => Promise<{
      id: string;
      status:
        | 'DRAFT'
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_ESCROW'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'COMPLETED'
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'DISPUTED'
        | 'CHARGEBACK'
        | 'EXPIRED';
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        displayName: string;
      };
      quantity: number;
      buyerNote: string | null;
      sellerNetAmount: string;
      reference: string;
      paymentStatus:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      escrowStatus:
        | 'REFUNDED'
        | 'NONE'
        | 'HELD'
        | 'RELEASE_PENDING'
        | 'RELEASED'
        | 'REFUND_PENDING'
        | 'SPLIT'
        | 'FROZEN';
      grossAmount: string;
      discountAmount: string;
      totalAmount: string;
      commissionSnapshot: {
        fixed: string;
        ruleId: string | null;
        scope: string;
        percentBps: number;
        minFee: string;
        computedFee: string;
        sellerNetAmount: string;
        premiumDiscountBps: number;
      };
      autoReleaseAt: string | null;
      buyer: {
        id: string;
        displayName: string;
      };
      service: {
        id: string;
        title: string;
        kind: string;
        deliveryType: string;
      };
      deliveryPayload: string | null;
    }>;
    confirm: (
      id: string,
      input: import('@prioritizz/schemas').OrderConfirmInput,
    ) => Promise<{
      id: string;
      status:
        | 'DRAFT'
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_ESCROW'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'COMPLETED'
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'DISPUTED'
        | 'CHARGEBACK'
        | 'EXPIRED';
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        displayName: string;
      };
      quantity: number;
      buyerNote: string | null;
      sellerNetAmount: string;
      reference: string;
      paymentStatus:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      escrowStatus:
        | 'REFUNDED'
        | 'NONE'
        | 'HELD'
        | 'RELEASE_PENDING'
        | 'RELEASED'
        | 'REFUND_PENDING'
        | 'SPLIT'
        | 'FROZEN';
      grossAmount: string;
      discountAmount: string;
      totalAmount: string;
      commissionSnapshot: {
        fixed: string;
        ruleId: string | null;
        scope: string;
        percentBps: number;
        minFee: string;
        computedFee: string;
        sellerNetAmount: string;
        premiumDiscountBps: number;
      };
      autoReleaseAt: string | null;
      buyer: {
        id: string;
        displayName: string;
      };
      service: {
        id: string;
        title: string;
        kind: string;
        deliveryType: string;
      };
      deliveryPayload: string | null;
    }>;
    message: (id: string, body: string) => Promise<void>;
  };
  payments: {
    createIntent: (
      input: import('@prioritizz/schemas').CreatePaymentIntentInput,
      idempotencyKey: string,
    ) => Promise<{
      id: string;
      status:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      amount: string;
      currency: 'XTR' | 'USD' | 'EUR';
      orderId: string;
      provider: string;
      clientSecret: string | null;
      providerPayload: Record<string, unknown> | null;
      expiresAt: string | null;
    }>;
    getIntent: (id: string) => Promise<{
      id: string;
      status:
        | 'CANCELED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
        | 'CHARGEBACK'
        | 'REQUIRES_PAYMENT'
        | 'PROCESSING'
        | 'SUCCEEDED'
        | 'FAILED';
      amount: string;
      currency: 'XTR' | 'USD' | 'EUR';
      orderId: string;
      provider: string;
      clientSecret: string | null;
      providerPayload: Record<string, unknown> | null;
      expiresAt: string | null;
    }>;
  };
  disputes: {
    open: (
      input: import('@prioritizz/schemas').OpenDisputeInput,
      idempotencyKey: string,
    ) => Promise<{
      id: string;
      status:
        | 'CANCELED'
        | 'REJECTED'
        | 'OPEN'
        | 'AWAITING_BUYER'
        | 'AWAITING_SELLER'
        | 'UNDER_REVIEW'
        | 'RESOLVED_RELEASE'
        | 'RESOLVED_REFUND'
        | 'RESOLVED_SPLIT';
      description: string;
      createdAt: string;
      updatedAt: string;
      reason:
        | 'NOT_DELIVERED'
        | 'NOT_AS_DESCRIBED'
        | 'PARTIAL_DELIVERY'
        | 'FRAUD_SUSPECTED'
        | 'BUYER_UNRESPONSIVE'
        | 'OTHER';
      orderId: string;
      desiredOutcome: string;
      requestedAmount: string | null;
      orderReference: string;
      openedByType: 'SELLER' | 'BUYER';
      slaDueAt: string | null;
      resolution: {
        outcome: string;
        refundAmount: string | null;
        rationale: string;
        resolvedByAdminId: string | null;
        resolvedAt: string;
      } | null;
    }>;
    get: (id: string) => Promise<{
      id: string;
      status:
        | 'CANCELED'
        | 'REJECTED'
        | 'OPEN'
        | 'AWAITING_BUYER'
        | 'AWAITING_SELLER'
        | 'UNDER_REVIEW'
        | 'RESOLVED_RELEASE'
        | 'RESOLVED_REFUND'
        | 'RESOLVED_SPLIT';
      description: string;
      createdAt: string;
      updatedAt: string;
      reason:
        | 'NOT_DELIVERED'
        | 'NOT_AS_DESCRIBED'
        | 'PARTIAL_DELIVERY'
        | 'FRAUD_SUSPECTED'
        | 'BUYER_UNRESPONSIVE'
        | 'OTHER';
      orderId: string;
      desiredOutcome: string;
      requestedAmount: string | null;
      orderReference: string;
      openedByType: 'SELLER' | 'BUYER';
      slaDueAt: string | null;
      resolution: {
        outcome: string;
        refundAmount: string | null;
        rationale: string;
        resolvedByAdminId: string | null;
        resolvedAt: string;
      } | null;
    }>;
    message: (id: string, body: string) => Promise<void>;
  };
  subscriptions: {
    plans: (audience?: string) => Promise<
      {
        name: string;
        id: string;
        currency: 'XTR' | 'USD' | 'EUR';
        code: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        priceAmount: string;
        audience: 'SELLER' | 'BUYER';
        interval: 'MONTH' | 'QUARTER' | 'YEAR';
        trialDays: number;
        perks: {
          commissionDiscountBps: number;
          maxActiveListings: number | null;
          prioritySupport: boolean;
          featuredPlacement: boolean;
          reducedPayoutDelayHours: number | null;
          buyerCashbackBps: number;
        };
      }[]
    >;
    mine: () => Promise<
      {
        id: string;
        status: 'CANCELED' | 'EXPIRED' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE';
        createdAt: string;
        updatedAt: string;
        plan: {
          name: string;
          id: string;
          code: string;
          audience: 'SELLER' | 'BUYER';
          interval: 'MONTH' | 'QUARTER' | 'YEAR';
          perks: {
            commissionDiscountBps: number;
            maxActiveListings: number | null;
            prioritySupport: boolean;
            featuredPlacement: boolean;
            reducedPayoutDelayHours: number | null;
            buyerCashbackBps: number;
          };
        };
        currentPeriodStart: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
      }[]
    >;
    subscribe: (
      input: import('@prioritizz/schemas').SubscribeInput,
      idempotencyKey: string,
    ) => Promise<{
      id: string;
      status: 'CANCELED' | 'EXPIRED' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE';
      createdAt: string;
      updatedAt: string;
      plan: {
        name: string;
        id: string;
        code: string;
        audience: 'SELLER' | 'BUYER';
        interval: 'MONTH' | 'QUARTER' | 'YEAR';
        perks: {
          commissionDiscountBps: number;
          maxActiveListings: number | null;
          prioritySupport: boolean;
          featuredPlacement: boolean;
          reducedPayoutDelayHours: number | null;
          buyerCashbackBps: number;
        };
      };
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    }>;
    cancel: (id: string) => Promise<{
      id: string;
      status: 'CANCELED' | 'EXPIRED' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE';
      createdAt: string;
      updatedAt: string;
      plan: {
        name: string;
        id: string;
        code: string;
        audience: 'SELLER' | 'BUYER';
        interval: 'MONTH' | 'QUARTER' | 'YEAR';
        perks: {
          commissionDiscountBps: number;
          maxActiveListings: number | null;
          prioritySupport: boolean;
          featuredPlacement: boolean;
          reducedPayoutDelayHours: number | null;
          buyerCashbackBps: number;
        };
      };
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    }>;
  };
  payouts: {
    mine: (query?: { [x: string]: string | number | boolean | null | undefined }) => Promise<{
      items: {
        id: string;
        status:
          'PAID' | 'CANCELED' | 'REJECTED' | 'APPROVED' | 'PROCESSING' | 'FAILED' | 'REQUESTED';
        amount: string;
        currency: 'XTR' | 'USD' | 'EUR';
        createdAt: string;
        updatedAt: string;
        sellerId: string;
        reference: string;
        method:
          | {
              type: 'TELEGRAM_STARS';
              handle: string;
            }
          | {
              type: 'CRYPTO';
              asset: string;
              address: string;
            }
          | {
              type: 'CARD';
              maskedPan: string;
              token: string;
            };
        feeAmount: string;
        netAmount: string;
        providerRef: string | null;
        failureReason: string | null;
        approvedByAdminId: string | null;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    request: (
      input: import('@prioritizz/schemas').RequestPayoutInput,
      idempotencyKey: string,
    ) => Promise<{
      id: string;
      status: 'PAID' | 'CANCELED' | 'REJECTED' | 'APPROVED' | 'PROCESSING' | 'FAILED' | 'REQUESTED';
      amount: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      sellerId: string;
      reference: string;
      method:
        | {
            type: 'TELEGRAM_STARS';
            handle: string;
          }
        | {
            type: 'CRYPTO';
            asset: string;
            address: string;
          }
        | {
            type: 'CARD';
            maskedPan: string;
            token: string;
          };
      feeAmount: string;
      netAmount: string;
      providerRef: string | null;
      failureReason: string | null;
      approvedByAdminId: string | null;
    }>;
  };
  admin: {
    dashboard: (range: string) => Promise<{
      completedOrders: number;
      disputeRate: number;
      range: '24h' | '7d' | '30d' | '90d';
      gmv: string;
      revenue: string;
      ordersCount: number;
      activeDisputes: number;
      pendingPayouts: number;
      pendingModeration: number;
      newUsers: number;
      activeSellers: number;
      refundRate: number;
      series: {
        date: string;
        gmv: string;
        revenue: string;
        orders: number;
      }[];
    }>;
    users: (query: { [x: string]: string | number | boolean | null | undefined }) => Promise<{
      items: {
        id: string;
        status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED';
        createdAt: string;
        updatedAt: string;
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
        languageCode: string | null;
        roles: string[];
        isSeller: boolean;
        buyerProfile: {
          completedOrders: number;
          disputeRate: number;
          premiumUntil: string | null;
        } | null;
        sellerProfile: {
          id: string;
          completedOrders: number;
          premiumUntil: string | null;
          displayName: string;
          tier: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER';
          ratingAvg: number;
          ratingCount: number;
          isVerified: boolean;
        } | null;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    moderateService: (
      id: string,
      input: import('@prioritizz/schemas').ModerationDecisionInput,
    ) => Promise<{
      id: string;
      title: string;
      status: 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
      description: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      ratingAvg: number;
      ratingCount: number;
      slug: string;
      summary: string;
      kind: 'DIGITAL_SERVICE' | 'SUBSCRIPTION' | 'TELEGRAM_GIFT' | 'DIGITAL_GOOD' | 'TOP_UP';
      deliveryType: 'MANUAL_CONFIRM' | 'AUTO_INSTANT' | 'AUTO_ON_RELEASE' | 'WORKFLOW_DROP';
      basePriceAmount: string;
      slaHours: number;
      refundPolicy: string;
      terms: string | null;
      tags: string[];
      minQuantity: number;
      maxQuantity: number;
      variants: {
        name: string;
        id: string;
        isActive: boolean;
        priceAmount: string;
        isDefault: boolean;
        description?: string | undefined;
        stock?: number | null | undefined;
      }[];
      moderationStatus: 'REJECTED' | 'PENDING' | 'APPROVED' | 'ESCALATED';
      category: {
        name: string;
        id: string;
        slug: string;
      };
      seller: {
        id: string;
        displayName: string;
        tier: string;
        ratingAvg: number;
        isVerified: boolean;
      };
      media: {
        id: string;
        url: string;
        kind: string;
      }[];
    }>;
    disputes: (query: { [x: string]: string | number | boolean | null | undefined }) => Promise<{
      items: {
        id: string;
        status:
          | 'CANCELED'
          | 'REJECTED'
          | 'OPEN'
          | 'AWAITING_BUYER'
          | 'AWAITING_SELLER'
          | 'UNDER_REVIEW'
          | 'RESOLVED_RELEASE'
          | 'RESOLVED_REFUND'
          | 'RESOLVED_SPLIT';
        description: string;
        createdAt: string;
        updatedAt: string;
        reason:
          | 'NOT_DELIVERED'
          | 'NOT_AS_DESCRIBED'
          | 'PARTIAL_DELIVERY'
          | 'FRAUD_SUSPECTED'
          | 'BUYER_UNRESPONSIVE'
          | 'OTHER';
        orderId: string;
        desiredOutcome: string;
        requestedAmount: string | null;
        orderReference: string;
        openedByType: 'SELLER' | 'BUYER';
        slaDueAt: string | null;
        resolution: {
          outcome: string;
          refundAmount: string | null;
          rationale: string;
          resolvedByAdminId: string | null;
          resolvedAt: string;
        } | null;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    resolveDispute: (
      id: string,
      input: import('@prioritizz/schemas').ResolveDisputeInput,
    ) => Promise<{
      id: string;
      status:
        | 'CANCELED'
        | 'REJECTED'
        | 'OPEN'
        | 'AWAITING_BUYER'
        | 'AWAITING_SELLER'
        | 'UNDER_REVIEW'
        | 'RESOLVED_RELEASE'
        | 'RESOLVED_REFUND'
        | 'RESOLVED_SPLIT';
      description: string;
      createdAt: string;
      updatedAt: string;
      reason:
        | 'NOT_DELIVERED'
        | 'NOT_AS_DESCRIBED'
        | 'PARTIAL_DELIVERY'
        | 'FRAUD_SUSPECTED'
        | 'BUYER_UNRESPONSIVE'
        | 'OTHER';
      orderId: string;
      desiredOutcome: string;
      requestedAmount: string | null;
      orderReference: string;
      openedByType: 'SELLER' | 'BUYER';
      slaDueAt: string | null;
      resolution: {
        outcome: string;
        refundAmount: string | null;
        rationale: string;
        resolvedByAdminId: string | null;
        resolvedAt: string;
      } | null;
    }>;
    payouts: (query: { [x: string]: string | number | boolean | null | undefined }) => Promise<{
      items: {
        id: string;
        status:
          'PAID' | 'CANCELED' | 'REJECTED' | 'APPROVED' | 'PROCESSING' | 'FAILED' | 'REQUESTED';
        amount: string;
        currency: 'XTR' | 'USD' | 'EUR';
        createdAt: string;
        updatedAt: string;
        sellerId: string;
        reference: string;
        method:
          | {
              type: 'TELEGRAM_STARS';
              handle: string;
            }
          | {
              type: 'CRYPTO';
              asset: string;
              address: string;
            }
          | {
              type: 'CARD';
              maskedPan: string;
              token: string;
            };
        feeAmount: string;
        netAmount: string;
        providerRef: string | null;
        failureReason: string | null;
        approvedByAdminId: string | null;
      }[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>;
    decidePayout: (
      id: string,
      decision: 'APPROVE' | 'REJECT',
      note?: string,
    ) => Promise<{
      id: string;
      status: 'PAID' | 'CANCELED' | 'REJECTED' | 'APPROVED' | 'PROCESSING' | 'FAILED' | 'REQUESTED';
      amount: string;
      currency: 'XTR' | 'USD' | 'EUR';
      createdAt: string;
      updatedAt: string;
      sellerId: string;
      reference: string;
      method:
        | {
            type: 'TELEGRAM_STARS';
            handle: string;
          }
        | {
            type: 'CRYPTO';
            asset: string;
            address: string;
          }
        | {
            type: 'CARD';
            maskedPan: string;
            token: string;
          };
      feeAmount: string;
      netAmount: string;
      providerRef: string | null;
      failureReason: string | null;
      approvedByAdminId: string | null;
    }>;
    commissionRules: () => Promise<
      {
        name: string;
        id: string;
        fixed: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        scope: 'SELLER' | 'GLOBAL' | 'SERVICE_KIND' | 'CATEGORY' | 'SELLER_TIER' | 'PROMO';
        percentBps: number;
        minFee: string;
        matcher: {
          categoryId?: string | undefined;
          sellerId?: string | undefined;
          promoCode?: string | undefined;
          serviceKind?:
            | 'DIGITAL_SERVICE'
            | 'SUBSCRIPTION'
            | 'TELEGRAM_GIFT'
            | 'DIGITAL_GOOD'
            | 'TOP_UP'
            | undefined;
          sellerTier?: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER' | undefined;
        };
        priority: number;
        maxFee?: string | null | undefined;
        activeFrom?: string | null | undefined;
        activeTo?: string | null | undefined;
      }[]
    >;
    upsertCommissionRule: (
      input: import('@prioritizz/schemas').CommissionRuleUpsertInput,
      id?: string,
    ) => Promise<{
      name: string;
      id: string;
      fixed: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      scope: 'SELLER' | 'GLOBAL' | 'SERVICE_KIND' | 'CATEGORY' | 'SELLER_TIER' | 'PROMO';
      percentBps: number;
      minFee: string;
      matcher: {
        categoryId?: string | undefined;
        sellerId?: string | undefined;
        promoCode?: string | undefined;
        serviceKind?:
          | 'DIGITAL_SERVICE'
          | 'SUBSCRIPTION'
          | 'TELEGRAM_GIFT'
          | 'DIGITAL_GOOD'
          | 'TOP_UP'
          | undefined;
        sellerTier?: 'STANDARD' | 'PLUS' | 'PRO' | 'PARTNER' | undefined;
      };
      priority: number;
      maxFee?: string | null | undefined;
      activeFrom?: string | null | undefined;
      activeTo?: string | null | undefined;
    }>;
    categories: {
      list: () => Promise<import('@prioritizz/schemas').Category[]>;
      upsert: (
        input: import('@prioritizz/schemas').CategoryUpsertInput,
        id?: string,
      ) => Promise<import('@prioritizz/schemas').Category>;
    };
  };
};
//# sourceMappingURL=api.d.ts.map
