import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { tokenManager } from './tokenManager';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 12000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ── Inject access token ───────────────────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await tokenManager.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
    pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
    pendingQueue = [];
}

api.interceptors.response.use(
    res => res,
    async (error: any) => {
        const original = error.config;

        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(normaliseError(error));
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then(newToken => {
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            });
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = await tokenManager.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefresh } = data.data;

            const playerId    = await tokenManager.getPlayerId();
            const accountType = await tokenManager.getAccountType();
            await tokenManager.saveAuth(accessToken, newRefresh, playerId || '', accountType || '');

            processQueue(null, accessToken);
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
        } catch (err) {
            processQueue(err, null);
            await tokenManager.clear();
            return Promise.reject(normaliseError(err));
        } finally {
            isRefreshing = false;
        }
    }
);

function normaliseError(err: any): Error {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Network error';
    return new Error(msg);
}

export default api;
