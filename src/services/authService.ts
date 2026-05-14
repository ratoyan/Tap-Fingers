import api from './api';
import { tokenManager } from './tokenManager';
import { AuthResult } from './types';

// ── Auth service ──────────────────────────────────────────────────────────────
// Talks to the TapFingers backend /api/auth/* endpoints. Every call that
// returns an AuthResult persists the token pair + player identity through
// `tokenManager`, so the rest of the app only ever reads from storage.

async function persistSession(result: AuthResult): Promise<AuthResult> {
    await tokenManager.saveAuth(
        result.accessToken,
        result.refreshToken,
        result.player.id,
        result.player.accountType,
    );
    return result;
}

export async function guestLogin(): Promise<AuthResult> {
    const { data } = await api.post('/auth/guest');
    return persistSession(data.data);
}

export async function googleLogin(idToken: string): Promise<AuthResult> {
    const { data } = await api.post('/auth/google', { idToken });
    return persistSession(data.data);
}

export async function appleLogin(identityToken: string): Promise<AuthResult> {
    const { data } = await api.post('/auth/apple', { identityToken });
    return persistSession(data.data);
}

export async function emailRegister(
    username: string,
    email: string,
    password: string,
): Promise<AuthResult> {
    const { data } = await api.post('/auth/register', { username, email, password });
    return persistSession(data.data);
}

export async function emailLogin(email: string, password: string): Promise<AuthResult> {
    const { data } = await api.post('/auth/login', { email, password });
    return persistSession(data.data);
}

// Upgrades the currently authenticated guest account to a Google account.
export async function linkGoogle(idToken: string): Promise<AuthResult> {
    const { data } = await api.post('/auth/link-google', { idToken });
    return persistSession(data.data);
}

// Upgrades the currently authenticated guest account to an Apple account.
export async function linkApple(identityToken: string): Promise<AuthResult> {
    const { data } = await api.post('/auth/link-apple', { identityToken });
    return persistSession(data.data);
}

export async function logout(): Promise<void> {
    try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
        // Best-effort: even if the server call fails we still clear local tokens.
    } finally {
        await tokenManager.clear();
    }
}

export async function isLoggedIn(): Promise<boolean> {
    return tokenManager.isLoggedIn();
}
