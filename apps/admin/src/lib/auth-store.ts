import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, TokenPair } from '@prioritizz/types';
import { ADMIN_ROLES, type Role } from '@prioritizz/constants';

interface AuthState {
  user: AuthUser | null;
  tokens: TokenPair | null;
  setSession: (user: AuthUser, tokens: TokenPair) => void;
  clear: () => void;
  hasRole: (role: Role) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      clear: () => set({ user: null, tokens: null }),
      hasRole: (role) => !!get().user?.roles.includes(role),
      isAdmin: () => !!get().user?.roles.some((r) => ADMIN_ROLES.includes(r as Role)),
    }),
    { name: 'prioritizz.admin.auth' },
  ),
);
