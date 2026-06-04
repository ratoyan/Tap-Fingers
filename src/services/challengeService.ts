import api from './api';
import { Challenge, MyChallengesPage } from './types';

// ── Challenge service ─────────────────────────────────────────────────────────
// Backend: GET /api/challenges (public catalog),
// GET /api/challenges/my (auth-only, includes per-player progress),
// POST /api/challenges/:id/claim (auth-only).
//
// Challenge progress is advanced server-side as a side effect of /game/end and
// /shop/purchase — there is no client-driven "update progress" endpoint.

export async function getChallenges(): Promise<Challenge[]> {
    const { data } = await api.get('/challenges');
    return data.data.challenges;
}

export async function getMyChallenges(page = 1, limit = 20): Promise<MyChallengesPage> {
    const { data } = await api.get('/challenges/my', { params: { page, limit } });
    return data.data;
}

export interface ClaimResult {
    coinsEarned: number;
    gemsEarned: number;
}

export async function claimChallenge(challengeId: number): Promise<ClaimResult> {
    const { data } = await api.post(`/challenges/${challengeId}/claim`);
    return data.data;
}
