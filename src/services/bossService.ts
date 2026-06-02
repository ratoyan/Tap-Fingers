import api from './api';
import { Boss } from './types';

// ── Boss service ──────────────────────────────────────────────────────────────
// Backend: GET /api/bosses (public catalog of admin-managed bosses).

export async function getBosses(): Promise<Boss[]> {
    const { data } = await api.get('/bosses');
    return data.data.bosses;
}

// The boss to show at a given level, fetched live from the backend (assigned
// boss → default → null). Used when a boss fight starts so the latest admin
// edits are reflected without re-entering Play.
export async function getBossForLevel(level: number): Promise<Boss | null> {
    const { data } = await api.get(`/bosses/${level}`);
    return data.data.boss;
}
