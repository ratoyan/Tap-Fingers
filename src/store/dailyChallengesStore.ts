import {create} from 'zustand';
import {storage} from '../db/kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';
import {DAILY_CHALLENGES, DailyChallengeDef} from '../data/dailyChallenges';
import {useGlobalStore} from './globalStore';

// ── Daily challenges (client-only) ────────────────────────────────────────────
// Progress for the three daily challenges is tracked entirely on-device. It is
// advanced from gameplay (see Play.submitGameSession → recordGame) and resets on
// a rolling 24h window anchored per player: the window starts on first use and,
// once 24h elapse, every challenge rolls back to zero for a fresh cycle. Claimed
// rewards are added to the on-device coin bonus in globalStore.

const RESET_MS = 24 * 60 * 60 * 1000;

interface DailyItemState {
    current: number;
    claimed: boolean;
}

// One challenge merged with its live per-cycle state, ready for the UI.
export interface DailyChallengeView extends DailyChallengeDef {
    current: number;
    claimed: boolean;
    completed: boolean;
    // 0–100, matching the ChallengeCard progress contract.
    percent: number;
}

interface DailyChallengesState {
    periodStart: number;
    items: Record<string, DailyItemState>;
    // Wall-clock the current window ends (periodStart + 24h); drives the reset
    // countdown on the screen.
    resetAt: number;

    // Loads persisted state once on app start (idempotent).
    hydrate: () => Promise<void>;
    // Rolls into a fresh cycle if the 24h window has elapsed. Called before every
    // read/mutation so stale progress never lingers.
    refresh: () => void;
    // Advances progress from one finished game. `coins` is the score banked this
    // run; `level` is the highest level reached in it.
    recordGame: (opts: {coins: number; level: number}) => void;
    // Advances the level challenges the instant a level is reached mid-game, so
    // "reach level 10" completes the moment level 10 lands, not at game end.
    recordLevel: (level: number) => void;
    // Claims a completed, unclaimed challenge: grants its coins to the on-device
    // bonus and marks it claimed. Returns the reward, or null if not claimable.
    claim: (id: string) => number | null;
    // Current challenges merged with live state, in catalog order.
    getViews: () => DailyChallengeView[];
    // Resets in-memory state on logout/account switch so the next account in the
    // same session starts clean. Storage is wiped separately by the caller.
    clear: () => void;
}

function emptyItems(): Record<string, DailyItemState> {
    const items: Record<string, DailyItemState> = {};
    for (const c of DAILY_CHALLENGES) {
        items[c.id] = {current: 0, claimed: false};
    }
    return items;
}

let hydrated = false;

export const useDailyChallengesStore = create<DailyChallengesState>((set, get) => {
    // Writes the persistable slice ({periodStart, items}) to device storage.
    function persist(periodStart: number, items: Record<string, DailyItemState>) {
        storage.setItem(
            STORAGE_KEYS.DAILY_CHALLENGES,
            JSON.stringify({periodStart, items}),
        );
    }

    // Starts a brand-new 24h cycle from `now` with every challenge back to zero.
    function startCycle(now: number) {
        const items = emptyItems();
        set({periodStart: now, items, resetAt: now + RESET_MS});
        persist(now, items);
    }

    return {
        periodStart: 0,
        items: emptyItems(),
        resetAt: 0,

        hydrate: async () => {
            if (hydrated) return;
            hydrated = true;
            try {
                const raw = await storage.getItem(STORAGE_KEYS.DAILY_CHALLENGES);
                const now = Date.now();
                if (!raw) {
                    startCycle(now);
                    return;
                }
                const parsed = JSON.parse(raw) as {periodStart: number; items: Record<string, DailyItemState>};
                // Elapsed window → fresh cycle. Otherwise adopt the stored state,
                // backfilling any challenge added since it was written.
                if (!parsed.periodStart || now - parsed.periodStart >= RESET_MS) {
                    startCycle(now);
                    return;
                }
                const items = emptyItems();
                for (const c of DAILY_CHALLENGES) {
                    const stored = parsed.items?.[c.id];
                    if (stored) {
                        items[c.id] = {
                            current: Math.min(stored.current ?? 0, c.target),
                            claimed: !!stored.claimed,
                        };
                    }
                }
                set({periodStart: parsed.periodStart, items, resetAt: parsed.periodStart + RESET_MS});
            } catch {
                startCycle(Date.now());
            }
        },

        refresh: () => {
            const {periodStart} = get();
            const now = Date.now();
            if (!periodStart || now - periodStart >= RESET_MS) {
                startCycle(now);
            }
        },

        recordGame: ({coins, level}) => {
            get().refresh();
            const items = {...get().items};
            let changed = false;
            for (const c of DAILY_CHALLENGES) {
                const prev = items[c.id] ?? {current: 0, claimed: false};
                let next = prev.current;
                if (c.type === 'games') {
                    next = prev.current + 1;
                } else if (c.type === 'coins') {
                    next = prev.current + Math.max(0, Math.floor(coins));
                } else if (c.type === 'level') {
                    // Best level reached today, not a running sum.
                    next = Math.max(prev.current, level);
                }
                next = Math.min(next, c.target);
                if (next !== prev.current) {
                    items[c.id] = {...prev, current: next};
                    changed = true;
                }
            }
            if (changed) {
                set({items});
                persist(get().periodStart, items);
            }
        },

        recordLevel: (level) => {
            get().refresh();
            const items = {...get().items};
            let changed = false;
            for (const c of DAILY_CHALLENGES) {
                if (c.type !== 'level') continue;
                const prev = items[c.id] ?? {current: 0, claimed: false};
                const next = Math.min(Math.max(prev.current, level), c.target);
                if (next !== prev.current) {
                    items[c.id] = {...prev, current: next};
                    changed = true;
                }
            }
            if (changed) {
                set({items});
                persist(get().periodStart, items);
            }
        },

        claim: (id) => {
            get().refresh();
            const def = DAILY_CHALLENGES.find(c => c.id === id);
            if (!def) return null;
            const item = get().items[id];
            if (!item || item.claimed || item.current < def.target) return null;

            const items = {...get().items, [id]: {...item, claimed: true}};
            set({items});
            persist(get().periodStart, items);
            useGlobalStore.getState().grantBonusCoins(def.rewardCoins);
            return def.rewardCoins;
        },

        getViews: () => {
            get().refresh();
            const {items} = get();
            return DAILY_CHALLENGES.map((c) => {
                const item = items[c.id] ?? {current: 0, claimed: false};
                const percent = c.target > 0
                    ? Math.min(100, Math.round((item.current / c.target) * 100))
                    : 0;
                return {
                    ...c,
                    current: item.current,
                    claimed: item.claimed,
                    completed: item.current >= c.target,
                    percent,
                };
            });
        },

        clear: () => {
            // Re-arm hydration so the next account loads its own cycle from storage.
            hydrated = false;
            set({periodStart: 0, items: emptyItems(), resetAt: 0});
        },
    };
});
