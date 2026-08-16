import {storage} from './kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';

// ── Cached shop artwork ───────────────────────────────────────────────────────
// The backend catalog owns how every skin looks: a card's SVG and render flags,
// and every background's palette — which, since backgrounds became one shared
// city scene, is the whole of what a background is. The app resolves the
// equipped card/background at launch from the cached profile, long before
// anything calls GET /shop, so the last-seen catalog artwork is mirrored here
// and read back on the next start.
//
// Purely a cache: a successful catalog fetch always overwrites it, and losing it
// costs one launch's worth of correct colours (the city falls back to its
// built-in sky). Wiped with the rest of the KV store on logout.

export function saveShopArt(art: Record<string, unknown>): void {
    // Fire-and-forget — the in-memory registry is already updated, and a storage
    // hiccup must never take a shop load down with it.
    storage.setItem(STORAGE_KEYS.SHOP_ART, JSON.stringify(art)).catch(() => {});
}

export async function loadShopArt<T>(): Promise<Record<string, T> | null> {
    try {
        const raw = await storage.getItem(STORAGE_KEYS.SHOP_ART);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Guard against an array or a primitive left by an older/corrupt write.
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}
