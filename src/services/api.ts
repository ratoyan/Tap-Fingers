import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// tapfingers.local → C:\rob-project\mobile\tapfingers-backend\public
export const BASE_URL = 'http://tapfingers.local/api'; // emulator + browser
// export const BASE_URL = 'http://192.168.1.XXX/api'; // real device (replace with your PC's local IP)

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
});

api.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem('api_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        const msg = err.response?.data?.error ?? 'Network error';
        return Promise.reject(new Error(msg));
    }
);

export default api;
