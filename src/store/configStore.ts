import {create} from 'zustand';

// Admin-controlled game tuning, mirrored from the backend's GameConfig.
// The fallback (30) keeps the UI usable before any /game/config or
// /game/start response has populated the real value.
const DEFAULT_LEVEL_LENGTH = 30;

interface ConfigState {
    levelLength: number;
    setLevelLength: (value: number) => void;
    // Admin-controlled global ad switch (from /game/config). When false the app
    // hides every "watch ad" affordance and the bottom banner. Defaults to
    // FALSE and is only ever turned on by the backend: until /game/config has
    // actually answered, the app shows no ads at all. Starting from `true` meant
    // a cold start (or an offline one, or a config request that never lands)
    // showed ad buttons the admin may have switched off, then took them away
    // once the real value arrived — off-by-default can only err the safe way.
    adsEnabled: boolean;
    setAdsEnabled: (value: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
    levelLength: DEFAULT_LEVEL_LENGTH,

    setLevelLength: (value: number) => {
        if (!Number.isFinite(value) || value <= 0) return;
        set({levelLength: Math.round(value)});
    },

    adsEnabled: false,
    setAdsEnabled: (value: boolean) => set({adsEnabled: !!value}),
}));
