import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    ACCESS:   'tf_access_token',
    REFRESH:  'tf_refresh_token',
    PLAYER_ID:'tf_player_id',
    ACCOUNT:  'tf_account_type',
};

export const tokenManager = {
    async saveAuth(accessToken: string, refreshToken: string, playerId: string, accountType: string) {
        await AsyncStorage.multiSet([
            [KEYS.ACCESS,    accessToken],
            [KEYS.REFRESH,   refreshToken],
            [KEYS.PLAYER_ID, playerId],
            [KEYS.ACCOUNT,   accountType],
        ]);
    },

    async getAccessToken(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.ACCESS);
    },

    async getRefreshToken(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.REFRESH);
    },

    async getPlayerId(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.PLAYER_ID);
    },

    async getAccountType(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.ACCOUNT);
    },

    async isLoggedIn(): Promise<boolean> {
        const token = await AsyncStorage.getItem(KEYS.ACCESS);
        return !!token;
    },

    async clear() {
        await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.PLAYER_ID, KEYS.ACCOUNT]);
    },
};
