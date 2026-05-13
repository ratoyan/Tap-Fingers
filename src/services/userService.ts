import api from './api';

export async function getProfile() {
    const {data} = await api.get('/user/profile');
    return data;
}

export async function updateProfile(payload: {name?: string; photo_url?: string | null}) {
    const {data} = await api.put('/user/profile', payload);
    return data;
}

export async function syncProgress(payload: {
    coins?: number;
    level?: number;
    high_score?: number;
    bomb_count?: number;
    slow_count?: number;
    shield_count?: number;
    purchased_cards?: string[];
    purchased_backgrounds?: string[];
    current_card_id?: string;
    current_background_id?: string | null;
}) {
    const {data} = await api.put('/user/progress', payload);
    return data;
}
