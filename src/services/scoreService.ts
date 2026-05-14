import api from './api';
import { Leaderboard, ScoreEntry } from './types';

// ── Score service ─────────────────────────────────────────────────────────────
// Backend: GET /api/scores/leaderboard (public, paginated),
// GET /api/scores/my (auth-only).

export async function getLeaderboard(page = 1, limit = 50): Promise<Leaderboard> {
    const { data } = await api.get('/scores/leaderboard', { params: { page, limit } });
    return data.data;
}

export async function getMyScores(): Promise<ScoreEntry[]> {
    const { data } = await api.get('/scores/my');
    return data.data.scores;
}
