import api from './api';
import { GameConfig, GameEndResult, GameStartResult } from './types';

// ── Game service ──────────────────────────────────────────────────────────────
// Backend: GET /api/game/config (public), POST /api/game/start,
// POST /api/game/end (both auth-only).
//
// The server is authoritative for coins: `endSession` runs anti-cheat
// validation and returns the real coin total. Anti-cheat requires the
// submitted `score` to stay within 5% of `taps`, so the caller must submit
// an honest tap count for both.

export async function getGameConfig(): Promise<GameConfig> {
    const { data } = await api.get('/game/config');
    return data.data;
}

// Opens a server-side game session and returns the `sessionToken` that
// `endSession` must echo back — without it the run can't be submitted and no
// coins are banked. Also returns the authoritative helper stock for the run.
export async function startSession(): Promise<GameStartResult> {
    const { data } = await api.post('/game/start');
    return data.data;
}

export interface EndSessionPayload {
    sessionToken: string;
    score: number;
    taps: number;
    durationSecs: number;
    livesLost: number;
    maxCombo: number;
    // The level the player actually reached in-game. The server used to derive
    // this from `taps` alone, which under-counted every run that leaned on bombs
    // and golden boxes — those advance the on-screen level without a tap each.
    // Reported, not trusted: /game/end floors it at the taps-derived level and
    // caps it at the score-derived one, so it can raise a level the tap count
    // can't explain but not invent one the score can't either.
    level: number;
    // Helper counts are server-owned now (changed via /player/helpers/*), so the
    // client no longer reports a snapshot here.
}

export async function endSession(payload: EndSessionPayload): Promise<GameEndResult> {
    const { data } = await api.post('/game/end', payload);
    return data.data;
}
