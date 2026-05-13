import api from './api';

export async function fetchLeaderboard() {
    const {data} = await api.get('/progression/leaderboard');
    return data.leaderboard as any[];
}

export async function saveGameSession(payload: {
    score: number;
    level_reached: number;
    coins_earned?: number;
    duration_seconds?: number;
}) {
    const {data} = await api.post('/game/session', payload);
    return data;
}
