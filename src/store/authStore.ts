import {create} from 'zustand';
import {tokenManager} from '../services/tokenManager';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import {InventoryEntry, Player, PlayerStats} from '../services/types';
import {resolveBackgroundEntry, resolveCardEntry} from '../data/shopVisuals';
import {useGlobalStore} from './globalStore';
import {useShopStore} from './shopStore';

// ── Auth / session store ──────────────────────────────────────────────────────
// Single source of truth for "who is signed in" and the server-authoritative
// PlayerStats. On hydrate it fans the relevant slices out to the other stores:
//   - coins / gems  -> globalStore
//   - equipped card / background -> shopStore
// so the existing screens keep reading from the stores they already use.

type AuthStatus = 'idle' | 'loading' | 'authed' | 'unauthed';

interface AuthState {
    status: AuthStatus;
    player: Player | null;
    stats: PlayerStats | null;
    inventory: InventoryEntry[];

    // Runs once on app start: restores a session from stored tokens.
    bootstrap: () => Promise<void>;
    // Called right after a successful login (tokens already persisted).
    setSession: () => Promise<void>;
    // Re-fetches the full profile from the backend.
    refreshProfile: () => Promise<void>;
    // Optimistically merges a stats patch (e.g. after a game / purchase).
    patchStats: (patch: Partial<PlayerStats>) => void;
    logout: () => Promise<void>;
}

function fanOutStats(stats: PlayerStats | null) {
    if (!stats) return;
    useGlobalStore.getState().setCoins(stats.coins ?? 0);
    useGlobalStore.getState().setGems(stats.gems ?? 0);
    useShopStore.getState().setCard(resolveCardEntry(stats.activeCardKey));
    useShopStore.getState().setBackground(resolveBackgroundEntry(stats.activeBackgroundKey));
}

export const useAuthStore = create<AuthState>((set, get) => ({
    status: 'idle',
    player: null,
    stats: null,
    inventory: [],

    bootstrap: async () => {
        set({status: 'loading'});
        const hasToken = await tokenManager.isLoggedIn();
        if (!hasToken) {
            set({status: 'unauthed'});
            return;
        }
        try {
            const profile = await userService.getProfile();
            fanOutStats(profile.stats);
            set({
                status: 'authed',
                player: profile.player,
                stats: profile.stats,
                inventory: profile.inventory ?? [],
            });
        } catch {
            // A genuine auth failure (401 + failed refresh) has already cleared
            // the tokens inside the axios interceptor. A plain network error
            // leaves them intact — don't wipe them here, just fall back to the
            // sign-in screen so the next launch can retry.
            set({status: 'unauthed', player: null, stats: null, inventory: []});
        }
    },

    setSession: async () => {
        await get().refreshProfile();
    },

    refreshProfile: async () => {
        const profile = await userService.getProfile();
        fanOutStats(profile.stats);
        set({
            status: 'authed',
            player: profile.player,
            stats: profile.stats,
            inventory: profile.inventory ?? [],
        });
    },

    patchStats: (patch) => {
        const current = get().stats;
        if (!current) return;
        const next = {...current, ...patch};
        fanOutStats(next);
        set({stats: next});
    },

    logout: async () => {
        await authService.logout();
        useGlobalStore.getState().setCoins(0);
        useGlobalStore.getState().setGems(0);
        useShopStore.getState().setCard(null);
        useShopStore.getState().setBackground(null);
        set({status: 'unauthed', player: null, stats: null, inventory: []});
    },
}));
