import api from './api';

export async function fetchChallenges() {
    const {data} = await api.get('/challenges');
    return data.challenges as any[];
}

export async function updateChallengeProgress(challengeId: string, progress: number) {
    const {data} = await api.put(`/challenges/${challengeId}/progress`, {progress});
    return data;
}

export async function claimChallenge(challengeId: string) {
    const {data} = await api.post(`/challenges/${challengeId}/claim`);
    return data;
}
