import {create} from 'zustand';
import {storage} from '../db/kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';

// Coins/gems mirror the server-authoritative PlayerStats. The mutating helpers
// (addCoins/minusCoins) are optimistic — the next profile refresh or API
// response (game end, purchase, challenge claim) reconciles them with the
// backend via setCoins/setGems.
//
// `bonusCoins` is the one exception: it holds coins earned from the client-only
// daily challenges (see dailyChallengesStore). The backend knows nothing about
// them, so they are persisted on-device and re-layered on top of every
// server-authoritative coin value in setCoins(). This keeps the daily reward
// visible and persistent across profile refreshes and app restarts. Trade-off:
// because the server balance excludes them, a purchase funded purely by bonus
// coins would be rejected server-side — bonus coins inflate the on-device
// balance only.
interface GlobalState {
    coins: number;      // displayed total = server coins + bonusCoins
    gems: number;
    bonusCoins: number; // device-local coins from claimed daily challenges
    addCoins: (amount: number) => void;
    minusCoins: (amount: number) => void;
    setCoins: (value: number) => void;
    setGems: (value: number) => void;
    // Adds a claimed daily-challenge reward to the on-device bonus and persists
    // it. Bumps the displayed balance immediately.
    grantBonusCoins: (amount: number) => void;
    // Loads the persisted bonus once on app start and layers it onto the
    // currently displayed balance. Safe to call before or after the first
    // setCoins — the balance converges to server + bonus either way.
    hydrateBonusCoins: () => Promise<void>;
    // Drops the in-memory bonus on logout/account switch so it can't leak into
    // the next account in the same session. Storage is wiped separately.
    clearBonusCoins: () => void;
}

// Module-level guard so hydrateBonusCoins runs its (relative) coin bump exactly
// once, without becoming part of the reactive store state.
let bonusHydrated = false;

export const useGlobalStore = create<GlobalState>((set, get) => ({
    coins: 0,
    gems: 0,
    bonusCoins: 0,

    addCoins: (amount: number) =>
        set((state) => ({
            coins: state.coins + amount,
        })),

    minusCoins: (amount: number) =>
        set((state) => ({
            coins: Math.max(0, state.coins - amount),
        })),

    // Server-authoritative value; the device-local bonus rides on top so the
    // daily-challenge coins survive every reconcile.
    setCoins: (value: number) =>
        set((state) => ({
            coins: value + state.bonusCoins,
        })),

    setGems: (value: number) =>
        set({
            gems: value,
        }),

    grantBonusCoins: (amount: number) => {
        if (amount <= 0) return;
        const nextBonus = get().bonusCoins + amount;
        set((state) => ({
            bonusCoins: nextBonus,
            coins: state.coins + amount,
        }));
        storage.setItem(STORAGE_KEYS.DAILY_BONUS_COINS, JSON.stringify(nextBonus));
    },

    hydrateBonusCoins: async () => {
        // Guard against a double-hydrate: the coins bump below is relative, so
        // running it twice would count the bonus twice.
        if (bonusHydrated) return;
        bonusHydrated = true;
        try {
            const raw = await storage.getItem(STORAGE_KEYS.DAILY_BONUS_COINS);
            const stored = raw ? Number(JSON.parse(raw)) : 0;
            if (!stored || Number.isNaN(stored)) return;
            set((state) => ({
                bonusCoins: stored,
                // Layer onto whatever balance is shown right now; a later setCoins
                // recomputes server + bonusCoins and stays consistent.
                coins: state.coins + stored,
            }));
        } catch {}
    },

    clearBonusCoins: () => {
        // Re-arm hydration so the next account loads its own bonus from storage.
        bonusHydrated = false;
        set({bonusCoins: 0});
    },
}));
