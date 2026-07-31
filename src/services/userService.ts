import api from './api';
import { API_ORIGIN } from './config';
import {
    AdRewardResult,
    DailyBonusResult,
    HelperPurchaseResult,
    HelperType,
    LuckyWheelResult,
    LuckyWheelState,
    Player,
    Profile,
    ScoreEntry,
} from './types';

// ── Player service ────────────────────────────────────────────────────────────
// Backend: everything under /api/player (all auth-only).
//   GET  /player/profile          — full profile (player + stats + inventory)
//   PUT  /player/profile          — update username
//   GET  /player/scores           — this player's recent scores
//   POST /player/ad-reward        — rewarded-ad coins (server rate-limited)
//   GET  /player/lucky-wheel      — admin-configured wheel segments
//   POST /player/lucky-wheel      — daily spin (server picks the prize)
//   POST /player/helpers/purchase — spend coins on a gameplay helper

export async function getProfile(): Promise<Profile> {
    const { data } = await api.get('/player/profile');
    return data.data;
}

export async function updateProfile(username: string): Promise<Profile> {
    const { data } = await api.put('/player/profile', { username });
    return data.data;
}

// Turns the backend's relative avatar URL (player.avatarUrl) into an absolute,
// loadable URL, or null when the player has no photo.
export function resolveAvatarUrl(player?: Player | null): string | null {
    return player?.avatarUrl ? `${API_ORIGIN}${player.avatarUrl}` : null;
}

// Uploads a picked/captured image (local file uri) as the player's avatar.
// Returns the refreshed profile (with the new avatarUrl).
export async function uploadAvatar(uri: string): Promise<Profile> {
    const name = uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
    const ext  = (/\.(\w+)$/.exec(name)?.[1] || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const form = new FormData();
    // RN's FormData file part: { uri, name, type }.
    form.append('avatar', { uri, name, type } as any);

    // Override the default JSON content-type so the multipart boundary is set.
    const { data } = await api.post('/player/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
}

export async function deleteAvatar(): Promise<Profile> {
    const { data } = await api.delete('/player/avatar');
    return data.data;
}

// Email accounts only — both require the current password.
export async function changeEmail(currentPassword: string, email: string): Promise<Profile> {
    const { data } = await api.put('/player/email', { currentPassword, email });
    return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/player/password', { currentPassword, newPassword });
}

// Permanently deletes the account (cascades all progress server-side).
// Email accounts must pass their current password as confirmation.
export async function deleteAccount(password?: string): Promise<void> {
    await api.delete('/player/account', { data: password ? { password } : {} });
}

export async function getMyScores(): Promise<ScoreEntry[]> {
    const { data } = await api.get('/player/scores');
    return data.data.scores;
}

export async function claimAdReward(): Promise<AdRewardResult> {
    const { data } = await api.post('/player/ad-reward');
    return data.data;
}

// Credits a claimed daily challenge's coins to the server balance. The daily
// challenges are tracked on-device, so the server takes the challenge id and the
// device's 24h cycle start as the claim's identity: replaying the same pair is
// idempotent (see PlayerService::claimDailyBonus), which is what makes the
// client's retry queue safe.
export async function claimDailyBonus(challengeId: string, cycleStart: number): Promise<DailyBonusResult> {
    const { data } = await api.post('/player/daily-bonus', { challengeId, cycleStart });
    return data.data;
}

// Mirrors PlayerService::SPIN_COOLDOWN_SECONDS on the backend: one spin per
// rolling 24h, counted from the last spin. Only used for the offline fallback —
// whenever the server answers, its own countdown wins.
export const SPIN_COOLDOWN_SECONDS = 86_400;

// Layout + whether the spin is available right now. The cooldown is the
// server's call (see LuckyWheelState), so it travels with the layout.
export async function getLuckyWheel(): Promise<LuckyWheelState> {
    const { data } = await api.get('/player/lucky-wheel');
    return {
        segments:          data.data.segments ?? [],
        canSpin:           !!data.data.canSpin,
        nextSpinInSeconds: data.data.nextSpinInSeconds ?? 0,
    };
}

export async function spinLuckyWheel(): Promise<LuckyWheelResult> {
    const { data } = await api.post('/player/lucky-wheel');
    return data.data;
}

export async function purchaseHelper(type: HelperType): Promise<HelperPurchaseResult> {
    const { data } = await api.post('/player/helpers/purchase', { type });
    return data.data;
}

// Server-authoritative helper count changes (the stock lives in player_stats).
export interface HelperCountResult { type: HelperType; count: number; used?: boolean; }

// Consumes one helper when used in-game; server decrements (never below 0).
export async function useHelper(type: HelperType): Promise<HelperCountResult> {
    const { data } = await api.post('/player/helpers/use', { type });
    return data.data;
}

// Grants one free helper (rewarded-ad watch); server increments.
export async function grantHelper(type: HelperType): Promise<HelperCountResult> {
    const { data } = await api.post('/player/helpers/grant', { type });
    return data.data;
}
