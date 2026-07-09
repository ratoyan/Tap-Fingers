import {create} from 'zustand';

// Admin-controlled game tuning, mirrored from the backend's GameConfig.
// The fallback (30) keeps the UI usable before any /game/config or
// /game/start response has populated the real value.
const DEFAULT_LEVEL_LENGTH = 30;

interface ConfigState {
    levelLength: number;
    setLevelLength: (value: number) => void;
    // Admin-controlled global ad switch (from /game/config). When false the app
    // hides every "watch ad" affordance. Defaults to true so behaviour is
    // unchanged until the real config loads.
    adsEnabled: boolean;
    setAdsEnabled: (value: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
    levelLength: DEFAULT_LEVEL_LENGTH,

    setLevelLength: (value: number) => {
        if (!Number.isFinite(value) || value <= 0) return;
        set({levelLength: Math.round(value)});
    },

    adsEnabled: true,
    setAdsEnabled: (value: boolean) => set({adsEnabled: !!value}),
}));
