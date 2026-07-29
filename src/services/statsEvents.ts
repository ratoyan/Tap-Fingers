// ── Stats events ──────────────────────────────────────────────────────────────
// Lets a store hand a server-authoritative coin total to the auth store without
// importing it. The daily-challenge claim queue needs exactly this: authStore
// already imports dailyChallengesStore (to reset it on logout), so importing
// back the other way would close a cycle. Same indirection as sessionEvents.
//
// Without it the queue could only update the displayed balance, leaving the auth
// store's PlayerStats — and the Realm profile cache written from it — holding a
// pre-credit total that the next launch would restore.

type ServerCoinsHandler = (totalCoins: number) => void;

let handler: ServerCoinsHandler | null = null;

export function setServerCoinsHandler(h: ServerCoinsHandler) {
    handler = h;
}

// No-ops when nothing is listening yet (a flush that beats bootstrap): the
// balance is still applied to globalStore by the caller, and the next profile
// fetch reconciles the rest.
export function emitServerCoins(totalCoins: number) {
    handler?.(totalCoins);
}
