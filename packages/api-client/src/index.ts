import type {
  AdminLoginInput,
  Attachment,
  AuthResponse,
  BecomeSellerInput,
  Category,
  CategoryUpsertInput,
  ChatListQuery,
  ChatMessage,
  ChatPage,
  CommissionRule,
  CommissionRuleUpsertInput,
  CreateOrderInput,
  CreatePaymentIntentInput,
  CreateReviewInput,
  DashboardMetrics,
  Dispute,
  ModerationDecisionInput,
  OpenDisputeInput,
  Order,
  OrderConfirmInput,
  OrderDeliverInput,
  OrderEvent,
  OrderMessageInput,
  PaymentIntent,
  Payout,
  PresignResult,
  PresignUploadInput,
  RatingSummary,
  RequestPayoutInput,
  ResolveDisputeInput,
  Review,
  ReviewListQuery,
  Service,
  ServiceListQuery,
  ServiceUpsertInput,
  Subscription,
  SubscriptionPlan,
  SubscribeInput,
  UpdateMeInput,
  UserProfile,
  WalletSummary,
} from '@prioritizz/types';
import { HttpClient, type HttpClientOptions } from './http.js';

export * from './http.js';

type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
type Q = Record<string, string | number | boolean | undefined | null>;

export function createApiClient(options: HttpClientOptions) {
  const http = new HttpClient(options);

  return {
    http,

    auth: {
      telegram: (initData: string) =>
        http.post<AuthResponse>('auth/telegram', { initData }, { skipAuth: true }),
      refresh: (refreshToken: string) =>
        http.post<AuthResponse>('auth/refresh', { refreshToken }, { skipAuth: true }),
      adminLogin: (input: AdminLoginInput) =>
        http.post<AuthResponse>('auth/admin/login', input, { skipAuth: true }),
      adminTelegramWidget: (payload: Record<string, unknown>) =>
        http.post<AuthResponse>('auth/admin/telegram-widget', payload, { skipAuth: true }),
      telegramWidget: (payload: Record<string, unknown>) =>
        http.post<AuthResponse>('auth/telegram/widget', payload, { skipAuth: true }),
      logout: () => http.post<void>('auth/logout'),
      sessions: () => http.get<{ items: unknown[] }>('auth/sessions'),
    },

    me: {
      get: () => http.get<UserProfile>('me'),
      update: (input: UpdateMeInput) => http.patch<UserProfile>('me', input),
      wallet: () => http.get<WalletSummary>('me/wallet'),
      becomeSeller: (input: BecomeSellerInput) => http.post<UserProfile>('me/seller', input),
      syncAvatarFromTelegram: () => http.post<UserProfile>('me/avatar/from-telegram'),
    },

    catalog: {
      categories: () => http.get<Category[]>('categories'),
      listServices: (query: Partial<ServiceListQuery>) =>
        http.get<Paginated<Service>>('services', { query: query as Q }),
      getService: (idOrSlug: string) => http.get<Service>(`services/${idOrSlug}`),
      // seller
      createService: (input: ServiceUpsertInput) => http.post<Service>('seller/services', input),
      updateService: (id: string, input: ServiceUpsertInput) =>
        http.put<Service>(`seller/services/${id}`, input),
      submitService: (id: string) => http.post<Service>(`seller/services/${id}/submit`),
      pauseService: (id: string) => http.post<Service>(`seller/services/${id}/pause`),
      /** Seller's own listings, drafts and paused included. */
      myServices: (query: Partial<ServiceListQuery> = {}) =>
        http.get<Paginated<Service>>('seller/services', { query: query as Q }),
    },

    media: {
      /** Direct multipart upload — returns a ready-to-link attachment. */
      upload: (file: Blob, ownerType: string, filename = 'image.jpg') => {
        const form = new FormData();
        form.append('file', file, filename);
        return http.post<Attachment>('media/upload', form, { query: { ownerType } });
      },
      presign: (input: PresignUploadInput) => http.post<PresignResult>('media/presign', input),
      confirm: (id: string) => http.post<Attachment>(`media/${id}/confirm`),
      remove: (id: string) => http.delete<{ ok: boolean }>(`media/${id}`),
    },

    orders: {
      list: (query: Q) => http.get<Paginated<Order>>('orders', { query }),
      get: (id: string) => http.get<Order>(`orders/${id}`),
      timeline: (id: string) => http.get<OrderEvent[]>(`orders/${id}/events`),
      create: (input: CreateOrderInput, idempotencyKey: string) =>
        http.post<Order>('orders', input, { idempotencyKey }),
      cancel: (id: string, reason: string) => http.post<Order>(`orders/${id}/cancel`, { reason }),
      deliver: (id: string, input: OrderDeliverInput) =>
        http.post<Order>(`orders/${id}/deliver`, input),
      confirm: (id: string, input: OrderConfirmInput) =>
        http.post<Order>(`orders/${id}/confirm`, input),
    },

    chat: {
      list: (orderId: string, query: Partial<ChatListQuery> = {}) =>
        http.get<ChatPage>(`orders/${orderId}/messages`, { query: query as Q }),
      send: (orderId: string, input: OrderMessageInput) =>
        http.post<ChatMessage>(`orders/${orderId}/messages`, input),
      markRead: (orderId: string) => http.post<{ read: number }>(`orders/${orderId}/messages/read`),
    },

    reviews: {
      forService: (serviceId: string, query: Partial<ReviewListQuery> = {}) =>
        http.get<Paginated<Review>>(`services/${serviceId}/reviews`, { query: query as Q }),
      serviceSummary: (serviceId: string) =>
        http.get<RatingSummary>(`services/${serviceId}/reviews/summary`),
      forSeller: (sellerId: string, query: Partial<ReviewListQuery> = {}) =>
        http.get<Paginated<Review>>(`sellers/${sellerId}/reviews`, { query: query as Q }),
      create: (input: CreateReviewInput) => http.post<Review>('reviews', input),
      reply: (id: string, text: string) => http.post<Review>(`reviews/${id}/reply`, { text }),
    },

    payments: {
      createIntent: (input: CreatePaymentIntentInput, idempotencyKey: string) =>
        http.post<PaymentIntent>('payments/intents', input, { idempotencyKey }),
      getIntent: (id: string) => http.get<PaymentIntent>(`payments/intents/${id}`),
    },

    disputes: {
      open: (input: OpenDisputeInput, idempotencyKey: string) =>
        http.post<Dispute>('disputes', input, { idempotencyKey }),
      get: (id: string) => http.get<Dispute>(`disputes/${id}`),
      messages: (id: string) =>
        http.get<
          Array<{ id: string; authorType: string; body: string; mine: boolean; createdAt: string }>
        >(`disputes/${id}/messages`),
      message: (id: string, body: string) => http.post<Dispute>(`disputes/${id}/messages`, { body }),
    },

    notifications: {
      list: () =>
        http.get<
          Array<{
            id: string;
            template: string;
            title: string | null;
            body: string | null;
            readAt: string | null;
            createdAt: string;
          }>
        >('me/notifications'),
      markRead: () => http.post<{ read: number }>('me/notifications/read'),
    },

    subscriptions: {
      plans: (audience?: string) =>
        http.get<SubscriptionPlan[]>('subscription-plans', { query: { audience } }),
      mine: () => http.get<Subscription[]>('me/subscriptions'),
      subscribe: (input: SubscribeInput, idempotencyKey: string) =>
        http.post<Subscription>('subscriptions', input, { idempotencyKey }),
      cancel: (id: string) => http.post<Subscription>(`subscriptions/${id}/cancel`),
    },

    payouts: {
      mine: (query?: Q) => http.get<Paginated<Payout>>('me/payouts', { query }),
      request: (input: RequestPayoutInput, idempotencyKey: string) =>
        http.post<Payout>('payouts', input, { idempotencyKey }),
    },

    admin: {
      dashboard: (range: string) =>
        http.get<DashboardMetrics>('admin/dashboard', { query: { range } }),
      users: (query: Q) => http.get<Paginated<Record<string, unknown>>>('admin/users', { query }),
      updateUser: (
        id: string,
        input: { status?: string; rolesAdd?: string[]; rolesRemove?: string[]; reason: string },
      ) => http.patch<Record<string, unknown>>(`admin/users/${id}`, input),
      moderationQueue: (query: Q) =>
        http.get<Paginated<Record<string, unknown>>>('admin/services', { query }),
      moderateService: (id: string, input: ModerationDecisionInput) =>
        http.post<Record<string, unknown>>(`admin/services/${id}/moderate`, input),
      disputes: (query: Q) => http.get<Paginated<Dispute>>('admin/disputes', { query }),
      disputeThread: (id: string) =>
        http.get<Array<Record<string, unknown>>>(`admin/disputes/${id}/thread`),
      resolveDispute: (id: string, input: ResolveDisputeInput) =>
        http.post<Dispute>(`admin/disputes/${id}/resolve`, input),
      payouts: (query: Q) => http.get<Paginated<Payout>>('admin/payouts', { query }),
      decidePayout: (id: string, decision: 'APPROVE' | 'REJECT', note?: string) =>
        http.post<Payout>(`admin/payouts/${id}/decision`, { decision, note }),
      commissionRules: () => http.get<CommissionRule[]>('admin/commission-rules'),
      upsertCommissionRule: (input: CommissionRuleUpsertInput, id?: string) =>
        id
          ? http.put<CommissionRule>(`admin/commission-rules/${id}`, input)
          : http.post<CommissionRule>('admin/commission-rules', input),
      disableCommissionRule: (id: string) =>
        http.delete<{ ok: boolean }>(`admin/commission-rules/${id}`),
      auditLog: (query: Q) => http.get<Paginated<Record<string, unknown>>>('admin/audit-logs', { query }),
      featureFlags: () => http.get<Array<Record<string, unknown>>>('admin/feature-flags'),
      updateFeatureFlag: (key: string, patch: Record<string, unknown>) =>
        http.put<Record<string, unknown>>(`admin/feature-flags/${key}`, patch),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
