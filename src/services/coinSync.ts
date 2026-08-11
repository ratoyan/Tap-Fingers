import * as userService from './userService';
import {useGlobalStore} from '../store/globalStore';
import {useDailyChallengesStore} from '../store/dailyChallengesStore';

// ── Coin sync (device → server) ──────────────────────────────────────────────
// Coins normally travel the other way: the server credits them (/game/end, ad
// reward, lucky wheel, daily bonus) and every one of those responses carries the
// new total, which the app applies through patchStats/setCoins. This module
// covers the case that leaves — the two have drifted apart (a response lost to a
// dropped connection, an offline claim, a rejected run) and the number the
// player has been looking at is the one that should win. It pushes the DISPLAYED
// balance to POST /player/coins, which overwrites the stored one.
//
// The whole difficulty is that the server is still crediting coins itself, so a
// push at the wrong moment double-counts. Play's boss bonus is the sharpest
// case: addCoins() shows it immediately, and the /game/end that lands afterwards
// adds the run's score — which already includes that bonus — on top of whatever
// the server holds. Push in between and the server's base is the inflated one,
// so the bonus is paid twice.
//
// Hence: no per-mutation push. It fires only at moments where the balance is
// settled — Home focus (never during a run) and the app going to the background
// — and only past the guards in pushCoins(). A push is an absolute SET, so
// repeating one is harmless.

// One request at a time: the triggers can overlap (backgrounding from Home).
let inFlight = false;

// Nesting depth of the pause, not a flag. A retry submits the finished run and
// starts the next one immediately, so run 1's /game/end can resolve — and lift
// its pause — seconds into run 2. Counting means run 2's own pause outlives it.
let pauseDepth = 0;

// Whether a session is live. authStore owns this — the store isn't imported
// here (it imports this module) and, more to the point, "there is an account to
// push to" is the session layer's fact to state, not something to infer.
let armed = false;

// Last value the server accepted. Skips the request when nothing has moved
// since — Home focus alone would otherwise push on every visit.
let lastPushed: number | null = null;

// Suspends the sync while a run is in progress: Play's optimistic addCoins() is
// reconciled by the /game/end response, and anything pushed in between would be
// counted twice by the server. Calls must be paired — one `true` when the run
// starts, one `false` once its submit has settled (or was skipped).
export function setCoinSyncPaused(next: boolean) {
    pauseDepth = next ? pauseDepth + 1 : Math.max(0, pauseDepth - 1);
}

// Called with true once a profile is loaded, and with false on logout / session
// expiry — which also drops the cached value and any pause, so the next account
// starts clean instead of inheriting the previous one's number.
export function setCoinSyncArmed(next: boolean) {
    armed = next;
    if (!next) {
        pauseDepth = 0;
        lastPushed = null;
    }
}

// Pushes the displayed balance if it is safe to do so. Never rejects: a failed
// push just leaves `lastPushed` alone so the next trigger retries.
export async function pushCoins(): Promise<void> {
    if (inFlight || pauseDepth > 0 || !armed) return;

    // A queued daily-bonus claim means the server is about to add those coins
    // itself (flushPending). They're already in the displayed balance via the
    // bonus offset, so pushing now and letting the claim land after would credit
    // them twice.
    if (useDailyChallengesStore.getState().pending.length > 0) return;

    const {coins: displayed, bonusCoins} = useGlobalStore.getState();
    const coins = Math.round(displayed);
    if (!Number.isFinite(coins) || coins < 0) return;
    if (coins === lastPushed) return;

    inFlight = true;
    try {
        const result = await userService.syncCoins(coins);
        lastPushed = result.coins;
        // The displayed balance is `server + bonusCoins`, and the server total
        // IS that sum now — so the offset has to go, or every later setCoins()
        // would layer it on top a second time and the balance would climb by the
        // bonus on each reconcile. Settled by the exact amount that was pushed:
        // a claim granted while the request was in flight keeps its own offset.
        useGlobalStore.getState().settleBonusCoins(bonusCoins);
    } catch {
        // Offline, or the server refused the value — keep showing what we have
        // and try again on the next trigger.
    } finally {
        inFlight = false;
    }
}
