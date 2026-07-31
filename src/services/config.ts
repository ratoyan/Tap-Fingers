import { Platform } from 'react-native';

// Android emulator → 10.0.2.2 reaches your PC's localhost
// iOS simulator   → localhost reaches your PC's localhost
// Real device     → replace with your PC's local IP (e.g. 192.168.1.42)
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Which backend a build talks to is decided here, not by hand-editing this line
// before a release. __DEV__ is true only for a Metro-served debug bundle, so a
// release APK/AAB always ships the production URL — the local one would be dead
// weight in it anyway: 10.0.2.2 only resolves inside an Android emulator, and the
// release manifest sets usesCleartextTraffic="false", which blocks plain http://
// outright.
export const API_BASE_URL = __DEV__
    ? `http://${DEV_HOST}:8000/api`
    : 'https://tapfingers.webixworld.com/api';

// Same host without the trailing /api — used to turn the relative media URLs
// the backend returns (e.g. player.avatarUrl) into absolute, loadable URLs.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
