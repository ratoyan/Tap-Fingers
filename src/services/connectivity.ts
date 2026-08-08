import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

import {syncGlobalConfig} from './configSync';
import {useNetworkStore} from '../store/networkStore';

// ── Connectivity watch ───────────────────────────────────────────────────────
// Two signals feed useNetworkStore, and they cover different failures:
//
//   1. NetInfo's native event — fires the INSTANT the device loses the network
//      (radio off, aeroplane mode, out of range). No request has to fail first
//      and nothing is polled, so the modal is up before the player can tap
//      anything. This is the signal for "no internet".
//
//   2. The axios interceptors in services/api.ts — every request the app makes
//      reports whether it landed. This is the signal NetInfo cannot give: a
//      phone with five bars of wifi that still can't reach OUR server (backend
//      down, captive portal, DNS poisoned).
//
// Recovery is confirmed rather than assumed: the radio coming back does not
// prove the server answers, so a reconnect triggers one real request and the
// modal only closes if that lands.

// NetInfo's own internet-reachability check is switched off. It works by
// hitting a remote URL on a timer for every player, which is traffic we don't
// need to pay for — signal (2) above already tells us whether the server is
// reachable, using requests the app was making anyway. `isConnected` (the part
// we do want) is read from the OS and costs nothing.
//
// Must run before the first addEventListener: configure() drops any listener
// already attached to the singleton.
NetInfo.configure({reachabilityShouldRun: () => false});

/** Gap between retries when the device has a network but the server is silent. */
const SERVER_RETRY_MS = 5000;

/**
 * One connection attempt. Never throws; resolves to the state it found.
 * Safe to call from a button — the store's `checking` flag drives the spinner.
 */
export async function probeConnection(): Promise<boolean> {
    const store = useNetworkStore.getState();
    if (store.checking) return store.online;

    store.setChecking(true);
    try {
        // A real /game/config call: the app's only public, unauthenticated,
        // always-cheap endpoint. Its verdict reaches the store through the api
        // interceptor, and coming back up therefore also refreshes the admin
        // config (ad switch, level length) that may have changed while we were
        // dark. syncGlobalConfig swallows its own errors.
        await syncGlobalConfig();
        return useNetworkStore.getState().online;
    } finally {
        useNetworkStore.getState().setChecking(false);
    }
}

/**
 * Starts watching the connection for the app's lifetime. Returns the teardown.
 *
 * The only timer here runs while the device HAS a network but the server is
 * unreachable — the one case nothing will wake us for. When the device itself
 * is offline there's no timer at all: NetInfo's event does that job, so nothing
 * touches the JS thread until the connection is genuinely back. That matters
 * because a stray tick during a round is felt on the game's frame budget.
 */
export function startConnectivityWatch(): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    // The last thing NetInfo told us. Starts optimistic for the same reason the
    // store does: nothing has gone wrong yet.
    let deviceOnline = true;

    const stopRetrying = () => {
        if (timer) clearTimeout(timer);
        timer = null;
    };

    const retryLater = () => {
        stopRetrying();
        if (!deviceOnline) return;   // NetInfo will wake us; don't spin on a dead radio
        timer = setTimeout(async () => {
            timer = null;
            if (useNetworkStore.getState().online) return;
            await probeConnection();
            // Chained rather than an interval so a slow probe (the 12s request
            // timeout) can't stack up behind itself.
            if (!useNetworkStore.getState().online) retryLater();
        }, SERVER_RETRY_MS);
    };

    const onNetInfoChange = (state: NetInfoState) => {
        // `isConnected` is null while the state is still unknown — only an
        // explicit false means the device really has no network.
        const nowOnline = state.isConnected !== false;
        const wasOnline = deviceOnline;
        deviceOnline = nowOnline;

        if (!nowOnline) {
            stopRetrying();
            useNetworkStore.getState().setOnline(false);
            return;
        }

        if (!wasOnline || !useNetworkStore.getState().online) {
            // Back on a network — but that isn't the same as the server
            // answering, so make it prove itself before dropping the modal.
            probeConnection().then(ok => { if (!ok) retryLater(); });
        }
    };

    // The listener is called with the current state right after subscribing, so
    // an app launched with the radio already off is handled without a separate
    // seed read.
    const unsubscribeNetInfo = NetInfo.addEventListener(onNetInfoChange);

    // Picks up drops reported by signal (2): a request failed even though the
    // device thinks it has a network, which means the server is the problem and
    // only a retry loop will notice it recovering.
    const unsubscribeStore = useNetworkStore.subscribe((state, prev) => {
        if (state.online === prev.online) return;
        if (state.online) stopRetrying(); else retryLater();
    });

    return () => {
        stopRetrying();
        unsubscribeNetInfo();
        unsubscribeStore();
    };
}
