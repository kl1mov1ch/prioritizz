import type { AuthUser, TokenPair } from '@prioritizz/types';
import { type Role } from '@prioritizz/constants';
interface AuthState {
  user: AuthUser | null;
  tokens: TokenPair | null;
  setSession: (user: AuthUser, tokens: TokenPair) => void;
  clear: () => void;
  hasRole: (role: Role) => boolean;
  isAdmin: () => boolean;
}
export declare const useAuthStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<AuthState>, 'setState' | 'persist'> & {
    setState(
      partial:
        AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>),
      replace?: false | undefined,
    ): unknown;
    setState(state: AuthState | ((state: AuthState) => AuthState), replace: true): unknown;
    persist: {
      setOptions: (
        options: Partial<
          import('zustand/middleware').PersistOptions<AuthState, AuthState, unknown>
        >,
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: AuthState) => void) => () => void;
      onFinishHydration: (fn: (state: AuthState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<AuthState, AuthState, unknown>
      >;
    };
  }
>;
export {};
//# sourceMappingURL=auth-store.d.ts.map
