import { createApiClient } from '@prioritizz/api-client';
import { useAuthStore } from './auth-store';
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
export const api = createApiClient({
  baseUrl,
  tokenStore: {
    getAccessToken: () => useAuthStore.getState().tokens?.accessToken ?? null,
    getRefreshToken: () => useAuthStore.getState().tokens?.refreshToken ?? null,
  },
  onUnauthorized: async () => {
    const refreshToken = useAuthStore.getState().tokens?.refreshToken;
    if (!refreshToken) return null;
    try {
      const res = await createApiClient({ baseUrl }).auth.refresh(refreshToken);
      useAuthStore.getState().setSession(res.user, res.tokens);
      return res.tokens.accessToken;
    } catch {
      useAuthStore.getState().clear();
      return null;
    }
  },
});
//# sourceMappingURL=api.js.map
