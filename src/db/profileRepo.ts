import Realm from 'realm';
import {getRealm, CachedProfile} from './realm';
import {Profile} from '../services/types';

// ── Profile cache (Realm) ─────────────────────────────────────────────────────
// The device only caches the one signed-in player, so a constant primary key is
// enough — logout clears it, the next login overwrites it.
const PROFILE_ID = 'me';

// Persists the full profile fetched from the backend. Called once at login and
// again whenever a mutation (name/email change, gameplay stats) returns a fresh
// profile, so the cache stays the source of truth for later reads.
export function saveProfile(profile: Profile): void {
    // Best-effort cache — never let a Realm failure break login/gameplay.
    try {
        const realm = getRealm();
        realm.write(() => {
            realm.create(
                'CachedProfile',
                {id: PROFILE_ID, raw: JSON.stringify(profile), updatedAt: new Date()},
                Realm.UpdateMode.Modified,
            );
        });
    } catch {}
}

// Reads the cached profile back. Returns null when nothing has been cached yet
// (fresh install / right after logout) so callers can fall back to one backend
// fetch.
export function loadProfile(): Profile | null {
    // Any Realm/parse failure → null, so bootstrap falls back to a backend fetch.
    try {
        const realm = getRealm();
        const row = realm.objectForPrimaryKey<CachedProfile>('CachedProfile', PROFILE_ID);
        if (!row) return null;
        return JSON.parse(row.raw) as Profile;
    } catch {
        return null;
    }
}

// Drops the cached profile (called on logout / account deletion).
export function clearProfile(): void {
    try {
        const realm = getRealm();
        const row = realm.objectForPrimaryKey<CachedProfile>('CachedProfile', PROFILE_ID);
        if (!row) return;
        realm.write(() => realm.delete(row));
    } catch {}
}
