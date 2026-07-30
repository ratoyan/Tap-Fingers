import { Platform } from 'react-native';

// Android emulator → 10.0.2.2 reaches your PC's localhost
// iOS simulator   → localhost reaches your PC's localhost
// Real device     → replace with your PC's local IP (e.g. 192.168.1.42)
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = 'https://tapfingers.webixworld.com/api';
// export const API_BASE_URL = 'http://10.0.2.2:8000/api';

// Same host without the trailing /api — used to turn the relative media URLs
// the backend returns (e.g. player.avatarUrl) into absolute, loadable URLs.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
