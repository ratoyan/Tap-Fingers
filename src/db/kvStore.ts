import Realm from 'realm';
import {getRealm, KeyValue} from './realm';

// ── Realm key-value store ─────────────────────────────────────────────────────
// A drop-in replacement for @react-native-async-storage/async-storage, backed by
// the Realm `KeyValue` table. It exposes the same async string API so existing
// call sites only need to swap the import (AsyncStorage → storage).
//
// Realm reads/writes are synchronous; we still return Promises so the API stays
// identical to AsyncStorage and `await` keeps working. Every method is
// defensive — a Realm failure resolves to a safe empty value instead of
// throwing, so a storage hiccup can never crash a screen.

function read(key: string): string | null {
    try {
        const row = getRealm().objectForPrimaryKey<KeyValue>('KeyValue', key);
        return row ? row.value : null;
    } catch {
        return null;
    }
}

function write(pairs: [string, string][]): void {
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
        try {
            const rows = getRealm().objects<KeyValue>('KeyValue');
            return Promise.resolve(rows.map(r => r.key));
        } catch {
            return Promise.resolve([]);
        }
    },

    // Wipes every KV entry (used on logout / account deletion). Note: this only
    // clears the key-value table; the cached profile is cleared separately via
    // profileRepo.clearProfile().
    clear(): Promise<void> {
        try {
            const realm = getRealm();
            realm.write(() => realm.delete(realm.objects('KeyValue')));
        } catch {}
        return Promise.resolve();
    },
};
