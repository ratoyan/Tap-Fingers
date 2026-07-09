import * as gameService from './gameService';
import {useConfigStore} from '../store/configStore';

// ── Global config sync ──────────────────────────────────────────────────────
// Single place the app reconciles the admin-controlled global config
// (`/game/config`: the ad on/off switch + level length).
//
// It is called on cold start AND whenever the app returns to the foreground and
// when the Home screen regains focus — so an admin toggle of the ad switch
// reaches an already-installed, already-running app instead of only once per
// launch. Best-effort: a network failure keeps the last known config (the next
// trigger retries) rather than throwing.
export async function syncGlobalConfig(): Promise<void> {
    try {
        const cfg = await gameService.getGameConfig();
        if (cfg?.adsEnabled !== undefined) useConfigStore.getState().setAdsEnabled(cfg.adsEnabled);
        if (cfg?.TAPS_PER_LEVEL) useConfigStore.getState().setLevelLength(cfg.TAPS_PER_LEVEL);
    } catch {
        // Offline / transient error — keep showing the last known config.
    }
}
