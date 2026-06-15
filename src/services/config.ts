import { Platform } from 'react-native';

// Android emulator → 10.0.2.2 reaches your PC's localhost
// iOS simulator   → localhost reaches your PC's localhost
// Real device     → replace with your PC's local IP (e.g. 192.168.1.42)
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = __DEV__
    ? `http://${DEV_HOST}:3002/api`
    : 'https://your-production-domain.com/api'; // ← replace before release
