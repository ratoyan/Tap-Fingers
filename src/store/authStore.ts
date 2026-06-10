import {create} from 'zustand';
import {tokenManager} from '../services/tokenManager';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as profileRepo from '../db/profileRepo';
import {InventoryEntry, Player, Profile, PlayerStats} from '../services/types';
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

export const useAuthStore = create<AuthState>((set, get) => {
    // Pushes a profile into the store and fans the relevant stats out to the
    // other stores (coins/gems → globalStore, equipped skins → shopStore).
    function applyProfile(profile: Profile) {
        fanOutStats(profile.stats);
        set({
            status: 'authed',
            player: profile.player,
            stats: profile.stats,
            inventory: profile.inventory ?? [],
        });
    }

    // The ONE place that fetches the profile from the backend: pull it, mirror
    // it into the local Realm cache, then apply it. Every later read goes
    // through the cache (see bootstrap) so the app doesn't re-hit the backend.
    async function fetchAndCacheProfile() {
        const profile = await userService.getProfile();
        profileRepo.saveProfile(profile);
        applyProfile(profile);
    }

    return {
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
            // Read the profile from Realm — no backend call on launch. The
            // network is only touched once, at the very first login (setSession)
            // or here as a fallback if the cache is somehow empty.
            const cached = profileRepo.loadProfile();
            if (cached) {
                applyProfile(cached);
                return;
            }
            try {
                await fetchAndCacheProfile();
            } catch {
                // A genuine auth failure (401 + failed refresh) has already
                // cleared the tokens inside the axios interceptor. A plain
                // network error leaves them intact — don't wipe them here, just
                // fall back to the sign-in screen so the next launch can retry.
                set({status: 'unauthed', player: null, stats: null, inventory: []});
            }
        },

        // Called right after a successful login: fetch the profile once and
        // cache it in Realm so subsequent launches read locally.
        setSession: async () => {
            await fetchAndCacheProfile();
        },

        // Forces a fresh backend fetch and re-caches it. Used by the profile
        // mutations (name/email change, guest upgrade) that need the updated
        // server profile right away.
        refreshProfile: async () => {
            await fetchAndCacheProfile();
        },

        patchStats: (patch) => {
            const current = get().stats;
            if (!current) return;
            const next = {...current, ...patch};
            fanOutStats(next);
            set({stats: next});
            // Keep the Realm cache in step with optimistic stat changes (coins
            // after a game, balance after a purchase) so they survive a restart.
            const {player, inventory} = get();
            if (player) profileRepo.saveProfile({player, stats: next, inventory});
        },

        logout: async () => {
            await authService.logout();
            profileRepo.clearProfile();
            useGlobalStore.getState().setCoins(0);
            useGlobalStore.getState().setGems(0);
            useShopStore.getState().setCard(null);
            useShopStore.getState().setBackground(null);
            set({status: 'unauthed', player: null, stats: null, inventory: []});
        },
    };
});
