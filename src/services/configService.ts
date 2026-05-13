import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppConfig {
    min_version: string;
    current_version: string;
    force_update: boolean;
    maintenance_mode: boolean;
    maintenance_msg: string;
    lucky_wheel_min: number;
    lucky_wheel_max: number;
    ad_coins_reward: number;
}

export async function fetchAppConfig(): Promise<AppConfig> {
    const {data} = await api.get('/config');
    await AsyncStorage.setItem('app_config', JSON.stringify(data));
    return data;
}

export async function getCachedConfig(): Promise<AppConfig | null> {
    const raw = await AsyncStorage.getItem('app_config');
    return raw ? JSON.parse(raw) : null;
}
