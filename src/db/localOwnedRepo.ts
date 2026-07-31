import {storage} from './kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';

// ── Device-local shop ownership (legacy, read-only) ───────────────────────────
// Written by older builds, where daily-challenge coins existed only on the
// device: a purchase they funded was refused server-side and recorded here
// instead, so /shop/inventory never listed it. Those coins are now credited to
// the backend when a challenge is claimed (see dailyChallengesStore), every
// purchase goes through POST /shop/purchase, and nothing adds to this set any
// more.
//
// It is still READ when the Shop loads and unioned with the server inventory,
// so players upgrading from those builds keep the items they paid for.
//
// Wiped with the rest of the KV store on logout / account deletion, so it can't
// leak into the next account.

export async function loadLocalOwned(): Promise<Set<string>> {
    try {
        const raw = await storage.getItem(STORAGE_KEYS.LOCAL_OWNED_ITEMS);
        const parsed = raw ? JSON.parse(raw) : null;
        return new Set(Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []);
    } catch {
        return new Set();
    }
}

export async function clearLocalOwned(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.LOCAL_OWNED_ITEMS);
}
