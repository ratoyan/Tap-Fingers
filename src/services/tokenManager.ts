import {storage} from '../db/kvStore.ts';

const KEYS = {
    ACCESS:   'tf_access_token',
    REFRESH:  'tf_refresh_token',
    PLAYER_ID:'tf_player_id',
    ACCOUNT:  'tf_account_type',
};

export const tokenManager = {
    async saveAuth(accessToken: string, refreshToken: string, playerId: string, accountType: string) {
        await storage.multiSet([
            [KEYS.ACCESS,    accessToken],
            [KEYS.REFRESH,   refreshToken],
            [KEYS.PLAYER_ID, playerId],
            [KEYS.ACCOUNT,   accountType],
        ]);
    },

    async getAccessToken(): Promise<string | null> {
        return storage.getItem(KEYS.ACCESS);
    },

    async getRefreshToken(): Promise<string | null> {
        return storage.getItem(KEYS.REFRESH);
    },

    async getPlayerId(): Promise<string | null> {
        return storage.getItem(KEYS.PLAYER_ID);
    },

    async getAccountType(): Promise<string | null> {
        return storage.getItem(KEYS.ACCOUNT);
    },

    async isLoggedIn(): Promise<boolean> {
        const token = await storage.getItem(KEYS.ACCESS);
        return !!token;
    },

    async clear() {
        await storage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.PLAYER_ID, KEYS.ACCOUNT]);
    },
};
