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

// The unauthenticated auth endpoints: a 401 here is a real credential/sign-up
// failure (e.g. wrong password), NOT an expired access token — so they must
// skip the auto-refresh path. Otherwise a failed login would try to refresh,
// find no refresh token (you're not logged in yet) and surface a confusing
// "No refresh token" instead of the actual error.
const AUTH_NO_REFRESH = /\/auth\/(login|register|guest|google|apple|refresh)/;

api.interceptors.response.use(
    res => res,
    async (error: any) => {
        const original = error.config;

        const isAuthRoute = AUTH_NO_REFRESH.test(original?.url || '');
        if (error.response?.status !== 401 || original._retry || isAuthRoute) {
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
            if (!refreshToken) {
                // No session to refresh — surface the original 401 (its real
                // message), not a synthetic "No refresh token".
                processQueue(error, null);
                return Promise.reject(normaliseError(error));
            }

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
