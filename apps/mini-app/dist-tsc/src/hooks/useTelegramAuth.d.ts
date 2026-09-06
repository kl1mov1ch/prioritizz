type Status = 'loading' | 'ready' | 'error';
/**
 * Exchanges Telegram initData for a session on first load. If a persisted
 * session already exists we trust it and let the HTTP client refresh lazily.
 */
export declare function useTelegramAuth(): {
    status: Status;
    user: {
        id: string;
        status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "BANNED";
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
        languageCode: string | null;
        roles: string[];
        isSeller: boolean;
    } | null;
    retry: () => void;
};
export {};
//# sourceMappingURL=useTelegramAuth.d.ts.map