// The Yandex ad unit IDs, resolved for the current build.
//
// Two axes decide which ID an ad request carries:
//   • ADS_ENV  — 'demo' for every build except the release AAB (see adsEnv.ts)
//   • Platform — Yandex registers one app per store, so the Google Play and the
//                App Store listing are separate apps with separate app IDs, and
//                therefore separate unit IDs. A single ID does NOT cover both.
//
// Unit ID shape: R-M-<appId>-<index>, e.g. R-M-1234567-1.
import {Platform} from 'react-native';
import {ADS_ENV} from './adsEnv.ts';

interface AdUnits {
    rewarded: string;
    banner: string;
}

// Yandex's official demo units. They always fill, never bill, and a click on one
// can't be mistaken for invalid traffic — which is why every non-release build
// uses them.
const DEMO: AdUnits = {
    rewarded: 'demo-rewarded-yandex',
    banner: 'demo-banner-yandex',
};

// ─── Real units ───────────────────────────────────────────────────────────────
// Paste the IDs from the Yandex Partner interface here. The X/Y placeholders are
// what scripts/build.js looks for: an AAB build aborts while any of them is still
// in place, so a demo-serving bundle can't reach the Play Store by accident.
//
// Banner unit must be created as "Adaptive sticky" — BottomBanner asks the SDK
// for a sticky size, and a unit configured as anything else won't fill it.
const PROD: Record<'android' | 'ios', AdUnits> = {
    android: {
        rewarded: 'R-M-19683421-2',
        banner: 'R-M-19683421-1',
    },
    ios: {
        rewarded: 'R-M-YYYYYYY-2',
        banner: 'R-M-YYYYYYY-1',
    },
};

const units: AdUnits =
    ADS_ENV === 'prod' ? PROD[Platform.OS === 'ios' ? 'ios' : 'android'] : DEMO;

export const AD_UNIT_REWARDED = units.rewarded;
export const AD_UNIT_BANNER = units.banner;
