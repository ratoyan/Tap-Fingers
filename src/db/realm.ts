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

let realmInstance: Realm | null = null;

// Lazily opens (and memoises) the single Realm instance for the app.
export function getRealm(): Realm {
    if (!realmInstance) {
        realmInstance = new Realm({
            schema: [CachedProfile],
            schemaVersion: 1,
        });
    }
    return realmInstance;
}
