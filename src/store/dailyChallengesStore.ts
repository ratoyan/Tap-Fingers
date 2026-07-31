import {create} from 'zustand';
import {storage} from '../db/kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';
import {DAILY_CHALLENGES, DailyChallengeDef} from '../data/dailyChallenges';
import * as userService from '../services/userService';
import {ApiError} from '../services/api';
import {emitServerCoins} from '../services/statsEvents';
import {useGlobalStore} from './globalStore';

// ── Daily challenges (client-tracked, server-paid) ────────────────────────────
// Progress for the three daily challenges is tracked entirely on-device. It is
// advanced from gameplay (see Play.submitGameSession → recordGame) and resets on
// a rolling 24h window anchored per player: the window starts on first use and,
// once 24h elapse, every challenge rolls back to zero for a fresh cycle.
//
// The reward coins, however, are NOT device-local: claiming queues a call to
// POST /player/daily-bonus so the coins land in the server balance. That matters
// because the Shop spends from that balance — coins that existed only on the
// device made every purchase they funded fail server-side ("Insufficient
// coins") and never reach player_inventory.
//
// Claiming stays instant and offline-safe: the reward is shown immediately as a
// globalStore bonus offset and the claim sits in `pending` until the backend
// confirms it (flushPending), at which point the offset is settled against the
// server's new total. (challengeId, cycleStart) is the claim's identity and the
// server treats a replay of the same pair as idempotent, so retrying can't
// double-pay.

const RESET_MS = 24 * 60 * 60 * 1000;

interface DailyItemState {
    current: number;
    claimed: boolean;
}

// One claimed-but-not-yet-credited reward.
interface PendingClaim {
    challengeId: string;
    // The 24h window the claim belongs to (periodStart), part of its identity.
    cycleStart: number;
    coins: number;
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
    // Claims waiting to be credited by the backend (offline, or a failed call).
    pending: PendingClaim[];

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
    // Claims a completed, unclaimed challenge: marks it claimed, shows the coins
    // immediately, and queues them for the backend. Returns the reward, or null
    // if not claimable. Stays synchronous — the server round-trip happens in the
    // background (flushPending) so the claim animation never waits on it.
    claim: (id: string) => number | null;
    // Sends every queued claim to the backend, settling each one against the
    // server balance as it lands. Safe to call any time; concurrent calls
    // collapse into the one already running. Resolves once the queue is empty
    // or the network gave up, so callers that need real coins (the Shop) can
    // await it before spending.
    flushPending: () => Promise<void>;
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
// Collapses concurrent flushes (app start + screen focus + a Shop purchase can
// all fire at once) into the single round-trip already in flight.
let flushInFlight: Promise<void> | null = null;

export const useDailyChallengesStore = create<DailyChallengesState>((set, get) => {
    // Writes the persistable slice ({periodStart, items}) to device storage.
    function persist(periodStart: number, items: Record<string, DailyItemState>) {
        storage.setItem(
            STORAGE_KEYS.DAILY_CHALLENGES,
            JSON.stringify({periodStart, items}),
        );
    }

    // The queue is persisted separately from the cycle: it outlives a cycle
    // reset, since a claim earned yesterday still has to be paid.
    function persistPending(pending: PendingClaim[]) {
        set({pending});
        storage.setItem(STORAGE_KEYS.DAILY_BONUS_PENDING, JSON.stringify(pending));
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
        pending: [],

        hydrate: async () => {
            if (hydrated) return;
            hydrated = true;

            // Queued claims first: a reward earned before the app was killed
            // still owes a server call, and the flush below (or the next one)
            // needs the queue in memory to send it.
            try {
                const rawPending = await storage.getItem(STORAGE_KEYS.DAILY_BONUS_PENDING);
                const parsed = rawPending ? JSON.parse(rawPending) : null;
                if (Array.isArray(parsed)) {
                    set({
                        pending: parsed.filter((p): p is PendingClaim =>
                            !!p && typeof p.challengeId === 'string'
                            && typeof p.cycleStart === 'number'
                            && typeof p.coins === 'number'),
                    });
                }
            } catch {
                // Corrupt queue — drop it rather than blocking hydration. The
                // coins stay in the bonus offset, so the player keeps them.
            }

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
            const cycleStart = get().periodStart;
            persist(cycleStart, items);

            // Pay out on-device first so the card flips and the balance moves on
            // this frame, then hand the claim to the backend. The offset is
            // settled when the server confirms — see flushPending.
            useGlobalStore.getState().grantBonusCoins(def.rewardCoins);
            persistPending([...get().pending, {challengeId: id, cycleStart, coins: def.rewardCoins}]);
            get().flushPending();

            return def.rewardCoins;
        },

        flushPending: () => {
            if (flushInFlight) return flushInFlight;
            if (get().pending.length === 0) return Promise.resolve();

            flushInFlight = (async () => {
                // Snapshot the queue: claim() may append while this runs, and
                // those late arrivals are picked up by the next flush.
                for (const entry of [...get().pending]) {
                    try {
                        const result = await userService.claimDailyBonus(entry.challengeId, entry.cycleStart);
                        // Credited (or already was, on a retry the server had
                        // seen). Either way the coins are in the server total
                        // now, so drop them from the local offset and adopt that
                        // total — the displayed balance doesn't move.
                        useGlobalStore.getState().settleBonusCoins(entry.coins);
                        useGlobalStore.getState().setCoins(result.totalCoins);
                        // Also push it into the session's PlayerStats (and the
                        // Realm profile cache written from it), or the next
                        // launch would restore the pre-credit total on top of an
                        // offset that no longer covers it.
                        emitServerCoins(result.totalCoins);
                        persistPending(get().pending.filter(p =>
                            !(p.challengeId === entry.challengeId && p.cycleStart === entry.cycleStart)));
                    } catch (error) {
                        const {status} = error as ApiError;
                        // 4xx is a verdict, not a hiccup: the server refuses this
                        // claim (unknown challenge, or the challenge's one payout
                        // per 24h is already spent). Retrying can only fail the
                        // same way, so drop it and leave the coins in the local
                        // offset — the player keeps what the app already showed.
                        if (typeof status === 'number' && status >= 400 && status < 500) {
                            persistPending(get().pending.filter(p =>
                                !(p.challengeId === entry.challengeId && p.cycleStart === entry.cycleStart)));
                            continue;
                        }
                        // Offline / server down — stop here and keep the rest of
                        // the queue for the next flush.
                        break;
                    }
                }
            })().finally(() => {
                flushInFlight = null;
            });

            return flushInFlight;
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
            set({periodStart: 0, items: emptyItems(), resetAt: 0, pending: []});
            // The queue is dropped from storage too, not just memory: a claim is
            // credited against whoever the access token belongs to, so one left
            // over from the previous account would pay the new one.
            storage.removeItem(STORAGE_KEYS.DAILY_BONUS_PENDING);
        },
    };
});
