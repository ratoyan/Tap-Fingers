import axios from 'axios';
import api from './api';
import { API_BASE_URL } from './config';
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

// ── Abandoned guest cleanup ───────────────────────────────────────────────────
// A guest account's only credential lives on this device (the backend mints it
// with no email or password). So the moment a sign-in points this device at a
// different player, the guest becomes unreachable forever — nobody can ever log
// back into it — while its row and progress sit in the database. We delete it as
// part of the switch.
//
// Ordering matters: this runs only AFTER the new session is persisted, so a
// failed sign-in (wrong password, offline) leaves the guest untouched.

interface PreviousSession {
    accessToken: string;
    refreshToken: string;
    playerId: string;
    accountType: string;
}

async function readStoredSession(): Promise<PreviousSession | null> {
    const [accessToken, refreshToken, playerId, accountType] = await Promise.all([
        tokenManager.getAccessToken(),
        tokenManager.getRefreshToken(),
        tokenManager.getPlayerId(),
        tokenManager.getAccountType(),
    ]);
    if (!accessToken || !refreshToken || !playerId) return null;
    return { accessToken, refreshToken, playerId, accountType: accountType ?? '' };
}

// Both calls below deliberately bypass `api` and go out on a bare axios client.
// `api` would inject the *stored* token (by now the new account's) over ours,
// and its 401 auto-refresh would retry with the new account's refresh token —
// i.e. it would delete the account the player just signed into.
async function deleteAccountAs(accessToken: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/player/account`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        // A guest has no password, and the backend only demands one for email
        // accounts (PlayerService::deleteAccount).
        data: {},
    });
}

async function accessTokenFrom(refreshToken: string): Promise<string> {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    return data.data.accessToken;
}

async function discardPreviousGuest(previous: PreviousSession | null, newPlayerId: string) {
    if (!previous || previous.accountType !== 'guest' || previous.playerId === newPlayerId) {
        return;
    }
    try {
        await deleteAccountAs(previous.accessToken);
        return;
    } catch (error: any) {
        // Anything other than "that token is no longer good" is not worth a
        // second attempt — leave the row behind rather than guess.
        if (error?.response?.status !== 401) return;
    }
    try {
        // The guest's access token aged out while the player sat on the form
        // (they last ~15 min). Its refresh token is still valid, so mint one
        // more and finish the job.
        await deleteAccountAs(await accessTokenFrom(previous.refreshToken));
    } catch {
        // Best-effort cleanup: the player is already signed into the new
        // account, so never let this failure surface as a sign-in error.
    }
}

export async function guestLogin(): Promise<AuthResult> {
    const { data } = await api.post('/auth/guest');
    return persistSession(data.data);
}

// The four calls below all point this device at a *different* player than the
// one it was holding, so each drops an abandoned guest behind it. The link-*
// calls further down don't: they upgrade the guest in place, same player id.

export async function googleLogin(idToken: string): Promise<AuthResult> {
    const previous = await readStoredSession();
    const { data } = await api.post('/auth/google', { idToken });
    const result = await persistSession(data.data);
    await discardPreviousGuest(previous, result.player.id);
    return result;
}

export async function appleLogin(identityToken: string): Promise<AuthResult> {
    const previous = await readStoredSession();
    const { data } = await api.post('/auth/apple', { identityToken });
    const result = await persistSession(data.data);
    await discardPreviousGuest(previous, result.player.id);
    return result;
}

export async function emailRegister(
    username: string,
    email: string,
    password: string,
): Promise<AuthResult> {
    const previous = await readStoredSession();
    const { data } = await api.post('/auth/register', { username, email, password });
    const result = await persistSession(data.data);
    await discardPreviousGuest(previous, result.player.id);
    return result;
}

export async function emailLogin(email: string, password: string): Promise<AuthResult> {
    const previous = await readStoredSession();
    const { data } = await api.post('/auth/login', { email, password });
    const result = await persistSession(data.data);
    await discardPreviousGuest(previous, result.player.id);
    return result;
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

// Upgrades the currently authenticated guest account to an email/password account.
export async function linkEmail(
    username: string,
    email: string,
    password: string,
): Promise<AuthResult> {
    const { data } = await api.post('/auth/link-email', { username, email, password });
    return persistSession(data.data);
}

// Confirms the player's email with the 6-digit code sent on register/link-email.
// On success the backend re-issues tokens reflecting the (possibly upgraded)
// account type — a pending guest becomes a real 'email' account here — so we
// persist the new pair before returning.
export async function verifyEmail(code: string): Promise<void> {
    const { data } = await api.post('/auth/verify-email', { code });
    const r = data.data;
    if (r?.accessToken && r?.refreshToken && r?.player) {
        await tokenManager.saveAuth(r.accessToken, r.refreshToken, r.player.id, r.player.accountType);
    }
}

// Re-sends a fresh confirmation code to the player's email.
export async function resendVerification(): Promise<void> {
    await api.post('/auth/resend-verification');
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
