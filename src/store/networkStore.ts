import {create} from 'zustand';

// ── Connection state ─────────────────────────────────────────────────────────
// "Can the game talk to the server right now." Two writers, no polling:
//   - services/connectivity.ts, from NetInfo's native event — instant when the
//     device itself loses the network;
//   - the axios interceptors in services/api.ts — every request reports whether
//     it landed, which is what catches a live network with a dead server.
// OfflineModal is the only reader.

interface NetworkState {
    /**
     * Optimistic: true until a request actually fails to reach the server.
     * Starting from false would flash "no connection" on every cold start,
     * before the app has even tried anything.
     */
    online: boolean;
    /**
     * A confirmation request is in flight. Only guards connectivity.ts against
     * probing on top of itself — the modal has nothing to press, so it doesn't
     * read this.
     */
    checking: boolean;

    setOnline: (value: boolean) => void;
    setChecking: (value: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
    online: true,
    checking: false,

    setOnline: (value: boolean) => {
        if (get().online === value) return;   // no-op writes would wake every subscriber
        set({online: value});
    },

    setChecking: (value: boolean) => set({checking: value}),
}));
