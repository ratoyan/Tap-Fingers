import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

async function saveSession(token: string, user: any, progress: any) {
    await AsyncStorage.multiSet([
        ['api_token', token],
        ['server_user', JSON.stringify(user)],
        ['server_progress', JSON.stringify(progress)],
    ]);
}

export async function loginWithGoogle(googleId: string, name: string, email?: string, photoUrl?: string) {
    const {data} = await api.post('/auth/google', {
        google_id: googleId,
        name,
        email,
        photo_url: photoUrl,
    });
    await saveSession(data.token, data.user, data.progress);
    return data;
}

export async function loginWithApple(appleId: string, name?: string, email?: string) {
    const {data} = await api.post('/auth/apple', {apple_id: appleId, name, email});
    await saveSession(data.token, data.user, data.progress);
    return data;
}

export async function loginAsGuest(deviceId?: string) {
    const {data} = await api.post('/auth/guest', {device_id: deviceId});
    await saveSession(data.token, data.user, data.progress);
    return data;
}

export async function getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem('api_token');
}

export async function logout() {
    await AsyncStorage.multiRemove(['api_token', 'server_user', 'server_progress']);
}
