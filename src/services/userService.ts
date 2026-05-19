import api from './api';
import {
    AdRewardResult,
    HelperPurchaseResult,
    HelperType,
    LuckyWheelResult,
    LuckyWheelSegment,
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

export async function getMyScores(): Promise<ScoreEntry[]> {
    const { data } = await api.get('/player/scores');
    return data.data.scores;
}

export async function claimAdReward(): Promise<AdRewardResult> {
    const { data } = await api.post('/player/ad-reward');
    return data.data;
}

export async function getLuckyWheelSegments(): Promise<LuckyWheelSegment[]> {
    const { data } = await api.get('/player/lucky-wheel');
    return data.data.segments;
}

export async function spinLuckyWheel(): Promise<LuckyWheelResult> {
    const { data } = await api.post('/player/lucky-wheel');
    return data.data;
}

export async function purchaseHelper(type: HelperType): Promise<HelperPurchaseResult> {
    const { data } = await api.post('/player/helpers/purchase', { type });
    return data.data;
}
