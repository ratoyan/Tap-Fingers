import Realm from 'realm';
import {getRealm, KeyValue} from './realm';

// ── Realm key-value store ─────────────────────────────────────────────────────
// A drop-in replacement for @react-native-async-storage/async-storage, backed by
// the Realm `KeyValue` table. It exposes the same async string API so existing
// call sites only need to swap the import (AsyncStorage → storage).
//
// An in-memory mirror (`mem`) sits in front of Realm so a value written this
// session is ALWAYS readable immediately — even if the Realm write is slow to
// commit or the native module misbehaves. This is what guarantees the auth
// token saved at login is read back on the very next request (otherwise that
// request goes out tokenless and the backend answers "Unauthorized"). Realm is
// still the persistence layer, so values survive across app restarts.
//
// Realm reads/writes are synchronous; we still return Promises so the API stays
// identical to AsyncStorage and `await` keeps working. Realm calls are
// defensive — a Realm failure falls back to the in-memory mirror instead of
// throwing, so a storage hiccup can never crash a screen or drop a token.

const mem = new Map<string, string>();

function read(key: string): string | null {
    // The in-memory mirror is authoritative for anything written this session.
    if (mem.has(key)) return mem.get(key)!;
    try {
        const row = getRealm().objectForPrimaryKey<KeyValue>('KeyValue', key);
        if (row) {
            mem.set(key, row.value);
            return row.value;
        }
        return null;
    } catch {
        return null;
    }
}

function write(pairs: [string, string][]): void {
    // Mirror first so reads are correct regardless of Realm's outcome.
    for (const [key, value] of pairs) mem.set(key, value);
    try {
        const realm = getRealm();
        realm.write(() => {
            for (const [key, value] of pairs) {
                realm.create('KeyValue', {key, value}, Realm.UpdateMode.Modified);
            }
        });
    } catch {}
}

function remove(keys: string[]): void {
    for (const key of keys) mem.delete(key);
    try {
        const realm = getRealm();
        realm.write(() => {
            for (const key of keys) {
                const row = realm.objectForPrimaryKey<KeyValue>('KeyValue', key);
                if (row) realm.delete(row);
            }
        });
    } catch {}
}

export const storage = {
    getItem(key: string): Promise<string | null> {
        return Promise.resolve(read(key));
    },

    setItem(key: string, value: string): Promise<void> {
        write([[key, value]]);
        return Promise.resolve();
    },

    removeItem(key: string): Promise<void> {
        remove([key]);
        return Promise.resolve();
    },

    multiSet(pairs: [string, string][]): Promise<void> {
        write(pairs);
        return Promise.resolve();
    },

    multiGet(keys: string[]): Promise<[string, string | null][]> {
        return Promise.resolve(keys.map(k => [k, read(k)] as [string, string | null]));
    },

    multiRemove(keys: string[]): Promise<void> {
        remove(keys);
        return Promise.resolve();
    },

    getAllKeys(): Promise<string[]> {
        const keys = new Set<string>(mem.keys());
        try {
            getRealm().objects<KeyValue>('KeyValue').forEach(r => keys.add(r.key));
        } catch {}
        return Promise.resolve([...keys]);
    },

    // Wipes every KV entry (used on logout / account deletion). Note: this only
    // clears the key-value table; the cached profile is cleared separately via
    // profileRepo.clearProfile().
    clear(): Promise<void> {
        mem.clear();
        try {
            const realm = getRealm();
            realm.write(() => realm.delete(realm.objects('KeyValue')));
        } catch {}
        return Promise.resolve();
    },
};
