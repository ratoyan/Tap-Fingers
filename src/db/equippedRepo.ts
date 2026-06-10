import {storage} from './kvStore';
import {STORAGE_KEYS} from '../utils/storageKeys';

// ── Equipped card / background (Realm) ────────────────────────────────────────
// Persists the equipped skins to (and reads them back from) the Realm-backed
// key-value store, so the player's last equip survives restarts and is served
// locally instead of being re-derived from the server.
export interface EquippedKeys {
    cardKey: string | null;
    backgroundKey: string | null;
}

export async function saveEquippedCard(key: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CARDID, key);
}

export async function saveEquippedBackground(key: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.BACKGROUNDID, key);
}

// Reads both equipped keys from Realm (null when nothing has been equipped yet).
export async function loadEquipped(): Promise<EquippedKeys> {
    const [cardKey, backgroundKey] = await Promise.all([
        storage.getItem(STORAGE_KEYS.CARDID),
        storage.getItem(STORAGE_KEYS.BACKGROUNDID),
    ]);
    return {cardKey, backgroundKey};
}

// Drops both equipped keys (logout / account deletion).
export async function clearEquipped(): Promise<void> {
    await storage.multiRemove([STORAGE_KEYS.CARDID, STORAGE_KEYS.BACKGROUNDID]);
}
