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
    /** A probe is in flight — the modal spins its retry button on this. */
    checking: boolean;
    /**
     * The player chose to carry on without a connection. Suppresses the modal
     * until we reconnect, so a dropped signal is reported once rather than
     * re-interrupting them every time a background request fails.
     */
    dismissed: boolean;

    setOnline: (value: boolean) => void;
    setChecking: (value: boolean) => void;
    dismiss: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
    online: true,
    checking: false,
    dismissed: false,

    setOnline: (value: boolean) => {
        if (get().online === value) return;   // no-op writes would wake every subscriber
        // Coming back up also clears the dismissal: the next drop is news again.
        set(value ? {online: true, dismissed: false} : {online: false});
    },

    setChecking: (value: boolean) => set({checking: value}),

    dismiss: () => set({dismissed: true}),
}));
