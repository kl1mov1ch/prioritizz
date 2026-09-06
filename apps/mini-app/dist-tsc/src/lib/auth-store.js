import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      clear: () => set({ user: null, tokens: null }),
    }),
    { name: 'prioritizz.auth' },
  ),
);
//# sourceMappingURL=auth-store.js.map
