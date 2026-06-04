import api from './api';
import { Leaderboard, MyRank, ScoreEntry } from './types';

// ── Score service ─────────────────────────────────────────────────────────────
// Backend: GET /api/scores/leaderboard (public, paginated),
// GET /api/scores/my-rank (auth-only), GET /api/scores/my (auth-only).

export async function getLeaderboard(page = 1, limit = 50): Promise<Leaderboard> {
    const { data } = await api.get('/scores/leaderboard', { params: { page, limit } });
    return data.data;
}

// The signed-in player's own leaderboard standing (best verified row + rank).
export async function getMyRank(): Promise<MyRank> {
    const { data } = await api.get('/scores/my-rank');
    return data.data;
}

export async function getMyScores(): Promise<ScoreEntry[]> {
    const { data } = await api.get('/scores/my');
    return data.data.scores;
}
