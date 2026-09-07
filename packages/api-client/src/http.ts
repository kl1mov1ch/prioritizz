import type { ApiError } from '@prioritizz/schemas';
import { ERROR_CODES } from '@prioritizz/constants';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly traceId?: string;

  constructor(status: number, body: Partial<ApiError> | undefined) {
    super(body?.message ?? 'Request failed');
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body?.code ?? ERROR_CODES.INTERNAL;
    this.details = body?.details;
    this.traceId = body?.traceId;
  }
}

export interface TokenStore {
  getAccessToken(): string | null | Promise<string | null>;
  getRefreshToken?(): string | null | Promise<string | null>;
  setTokens?(tokens: { accessToken: string; refreshToken: string }): void | Promise<void>;
  clear?(): void | Promise<void>;
}

export interface HttpClientOptions {
  baseUrl: string;
  tokenStore?: TokenStore;
  /** Called once when a 401 requires a token refresh. Return new access token or null. */
  onUnauthorized?: () => Promise<string | null>;
  /** Extra headers merged into every request (e.g. Telegram initData for first auth). */
  defaultHeaders?: () => Record<string, string>;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  // Allow a relative base like "/api/v1" (deployed behind a reverse proxy on
  // the same origin) — resolve it against the current page. `new URL` needs an
  // absolute base, so an origin-relative string would otherwise throw.
  let resolvedBase = baseUrl;
  if (/^\/(?!\/)/.test(baseUrl) && typeof window !== 'undefined') {
    resolvedBase = window.location.origin + baseUrl;
  }
  const url = new URL(
    path.replace(/^\//, ''),
    resolvedBase.endsWith('/') ? resolvedBase : `${resolvedBase}/`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function serializeBody(body: unknown, isForm: boolean): BodyInit | undefined {
  if (body === undefined) return undefined;
  return isForm ? (body as FormData) : JSON.stringify(body);
}

export class HttpClient {
  private refreshing: Promise<string | null> | null = null;

  constructor(private readonly opts: HttpClientOptions) {}

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const doFetch = this.opts.fetchImpl ?? fetch;
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.opts.defaultHeaders?.(),
      ...options.headers,
    };
    // FormData must keep the browser-generated multipart boundary, so never
    // force a content-type on it.
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body !== undefined && !isForm) headers['content-type'] = 'application/json';
    if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;

    if (!options.skipAuth && this.opts.tokenStore) {
      const token = await this.opts.tokenStore.getAccessToken();
      if (token) headers.authorization = `Bearer ${token}`;
    }

    const url = buildUrl(this.opts.baseUrl, path, options.query);
    let res = await doFetch(url, {
      method,
      headers,
      body: serializeBody(options.body, isForm),
      signal: options.signal,
    });

    if (res.status === 401 && !options.skipAuth && this.opts.onUnauthorized) {
      const newToken = await this.refreshOnce();
      if (newToken) {
        headers.authorization = `Bearer ${newToken}`;
        res = await doFetch(url, {
          method,
          headers,
          body: serializeBody(options.body, isForm),
          signal: options.signal,
        });
      }
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const parsed = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      throw new ApiClientError(res.status, parsed);
    }
    return parsed as T;
  }

  private refreshOnce(): Promise<string | null> {
    this.refreshing ??= (this.opts.onUnauthorized?.() ?? Promise.resolve(null)).finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, options);
  }
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, { ...options, body });
  }
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PATCH', path, { ...options, body });
  }
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', path, { ...options, body });
  }
  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, options);
  }
}
