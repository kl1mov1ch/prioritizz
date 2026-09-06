import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, TokenPair } from '@prioritizz/types';

interface AuthState {
  user: AuthUser | null;
  tokens: TokenPair | null;
  setSession: (user: AuthUser, tokens: TokenPair) => void;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
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
