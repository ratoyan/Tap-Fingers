import {create} from 'zustand';
import {tokenManager} from '../services/tokenManager';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as profileRepo from '../db/profileRepo';
import * as equippedRepo from '../db/equippedRepo';
import {InventoryEntry, Player, Profile, PlayerStats} from '../services/types';
import {resolveBackgroundEntry, resolveCardEntry} from '../data/shopVisuals';
import {useGlobalStore} from './globalStore';
import {useShopStore} from './shopStore';
import {useDailyChallengesStore} from './dailyChallengesStore';
import {setUnauthorizedHandler} from '../services/sessionEvents';
import {resetToWelcome} from '../navigation/navigationRef';
import {seedHelperDefaults} from '../utils/helpers';
import {withRetry} from '../utils/withRetry';

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
    // Tears down the local session after an unrecoverable 401 (tokens already
    // cleared by the axios interceptor) and bounces back to Welcome.
    sessionExpired: () => void;
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
        // Equipping is local-only (the Shop saves the equipped keys to Realm but
        // never pushes them to the server), so the server's activeCardKey /
        // activeBackgroundKey are stale. Overlay the locally-equipped keys onto
        // the fetched profile — same "Realm first, server fallback" rule the Shop
        // uses (see Shop.loadShop) — otherwise this refresh reverts a fresh equip.
        const equipped = await equippedRepo.loadEquipped();
        if (profile.stats) {
            if (equipped.cardKey) profile.stats.activeCardKey = equipped.cardKey;
            if (equipped.backgroundKey) profile.stats.activeBackgroundKey = equipped.backgroundKey;
        }
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

            // If the player has logged in before, their profile is cached in
            // Realm. Its presence means "logged in" (it's only written after a
            // successful login and wiped on logout), so restore the session
            // straight from Realm and land on Home — no token check, no network.
            const cached = profileRepo.loadProfile();
            if (cached) {
                applyProfile(cached);
                return;
            }

            // No cached profile. If a token still exists (e.g. the cache was
            // cleared but the session is valid), fetch the profile once.
            const hasToken = await tokenManager.isLoggedIn();
            if (hasToken) {
                try {
                    await withRetry(() => fetchAndCacheProfile());
                } catch {
                    // A genuine auth failure (401 + failed refresh) has already
                    // cleared the tokens inside the axios interceptor. A plain
                    // network error leaves them intact — don't wipe them here,
                    // just fall back to the sign-in screen so the next launch
                    // can retry.
                    set({status: 'unauthed', player: null, stats: null, inventory: []});
                }
                return;
            }

            // Brand-new launch (or a post-logout start) with no session at all:
            // silently create a guest account so the player lands straight in
            // the game — no sign-in wall. The backend mints a unique guest_id
            // (persisted via tokenManager) that the leaderboard and every authed
            // endpoint key off; the player can later upgrade or switch accounts
            // from the in-game Profile screen. If the network is down we fall
            // back to Welcome, whose guest button offers a manual retry.
            try {
                // Retry each network step: a shared-host overload can briefly
                // block the guest mint or the profile fetch, and we'd rather
                // wait a few seconds than strand the player on Welcome.
                await withRetry(() => authService.guestLogin());
                // Give the fresh guest the same starter helper stock the manual
                // "Continue as Guest" button seeds on the Welcome screen.
                await seedHelperDefaults();
                await withRetry(() => fetchAndCacheProfile());
            } catch {
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
            // Drop the device-local daily state/bonus before zeroing coins, so
            // the next account in this session doesn't inherit them.
            useDailyChallengesStore.getState().clear();
            useGlobalStore.getState().clearBonusCoins();
            useGlobalStore.getState().setCoins(0);
            useGlobalStore.getState().setGems(0);
            useShopStore.getState().setCard(null);
            useShopStore.getState().setBackground(null);
            set({status: 'unauthed', player: null, stats: null, inventory: []});
        },

        sessionExpired: () => {
            // The interceptor already cleared the (dead) tokens, so there's no
            // server logout to call — just wipe the local caches/state and reset
            // navigation to the sign-in screen.
            profileRepo.clearProfile();
            useDailyChallengesStore.getState().clear();
            useGlobalStore.getState().clearBonusCoins();
            useGlobalStore.getState().setCoins(0);
            useGlobalStore.getState().setGems(0);
            useShopStore.getState().setCard(null);
            useShopStore.getState().setBackground(null);
            set({status: 'unauthed', player: null, stats: null, inventory: []});
            resetToWelcome();
        },
    };
});

// Wire the axios layer's "unrecoverable 401" event to the session teardown.
setUnauthorizedHandler(() => useAuthStore.getState().sessionExpired());
