import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ADMIN_ROLES } from '@prioritizz/constants';
export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      clear: () => set({ user: null, tokens: null }),
      hasRole: (role) => !!get().user?.roles.includes(role),
      isAdmin: () => !!get().user?.roles.some((r) => ADMIN_ROLES.includes(r)),
    }),
    { name: 'prioritizz.admin.auth' },
  ),
);
//# sourceMappingURL=auth-store.js.map
