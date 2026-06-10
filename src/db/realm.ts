import Realm from 'realm';

// ── Local Realm database ──────────────────────────────────────────────────────
// On-device cache so the profile is read locally instead of re-fetched from the
// backend on every launch. The full Profile JSON (player + stats + inventory) is
// fetched ONCE at login and stored here; every later read comes from Realm.
//
// We persist the whole Profile as a single JSON blob (`raw`) keyed by a constant
// primary key — the device only ever caches the one signed-in player, and the
// Profile shape has many nested fields (stats + an inventory array of shop
// items), so a JSON round-trip is far more robust than mirroring every column.

export class CachedProfile extends Realm.Object<CachedProfile> {
    id!: string;
    raw!: string;
    updatedAt!: Date;

    static schema: Realm.ObjectSchema = {
        name: 'CachedProfile',
        primaryKey: 'id',
        properties: {
            id: 'string',
            raw: 'string',
            updatedAt: 'date',
        },
    };
}

// Generic string key→value row. Backs the AsyncStorage-compatible KV store
// (src/db/kvStore.ts) so every simple setting/flag the app used to keep in
// AsyncStorage (language, audio toggles, helper counts, auth tokens, profile
// photo, daily-limit dates…) now lives in Realm.
export class KeyValue extends Realm.Object<KeyValue> {
    key!: string;
    value!: string;

    static schema: Realm.ObjectSchema = {
        name: 'KeyValue',
        primaryKey: 'key',
        properties: {
            key: 'string',
            value: 'string',
        },
    };
}

let realmInstance: Realm | null = null;

// Must stay >= every schemaVersion ever shipped. A dev build briefly ran with
// version 3 (an extra `Equipped` table that was later removed); opening that
// on-disk file with a LOWER version makes Realm throw, which silently broke all
// persistence (so a logged-in user landed on Welcome after a restart). Keeping
// this above 3 lets Realm open + migrate the old file instead of throwing.
const REALM_CONFIG: Realm.Configuration = {
    schema: [CachedProfile, KeyValue],
    schemaVersion: 4,
};

// Lazily opens (and memoises) the single Realm instance for the app. If the
// on-disk file can't be opened (corrupt, or an incompatible schema from an
// older build), recreate it so the app keeps working — the only loss is the
// local cache, which is re-fetched from the backend on the next login.
export function getRealm(): Realm {
    if (!realmInstance) {
        try {
            realmInstance = new Realm(REALM_CONFIG);
        } catch {
            try { Realm.deleteFile(REALM_CONFIG); } catch {}
            realmInstance = new Realm(REALM_CONFIG);
        }
    }
    return realmInstance;
}
