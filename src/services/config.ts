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
// Set this to `true` only while no local backend is running — it points the dev
// build at production, which is fine for reading but means local backend work is
// invisible to the app. It is `false` because background artwork now lives on
// the server (shop_items.bg_image_path, streamed from /api/shop/background/{id}):
// production has neither the column nor the uploaded files until this is
// deployed, so every background there would fall back to flat colours.
const USE_PROD_IN_DEV = false;

export const API_BASE_URL =
    __DEV__ && !USE_PROD_IN_DEV
        ? `http://${DEV_HOST}:8000/api`
        : 'https://tapfingers.webixworld.com/api';

// Same host without the trailing /api — used to turn the relative media URLs
// the backend returns (e.g. player.avatarUrl) into absolute, loadable URLs.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// The backend returns media paths without a host so the same value works from an
// emulator, a LAN device and production; this is where they become loadable.
export function mediaUrl(relative?: string | null): string | null {
    return relative ? `${API_ORIGIN}${relative}` : null;
}
