// Rewarded-ad gateway for the three "Watch Ad" buttons in the app
// (Home/Shop coin reward, Play lose-screen heart revive, Play free helper).
//
// Ad network: Yandex Mobile Ads (yandex-mobile-ads plugin).
//
// DEMO MODE: every request uses Yandex's official demo unit IDs, so a real fill
// is never served and clicks are safe during development. Swap AD_UNIT_REWARDED
// and AD_UNIT_BANNER for the real unit IDs from the Yandex Partner interface
// (R-M-XXXXXX-Y format) before release — nothing else here changes. Yandex unit
// IDs are per-app, not per-platform, so one ID covers Android and iOS.
//
// The reward is granted by the caller ONLY when showRewardedAd() resolves true,
// i.e. the user actually watched to the reward point. A failed load, no fill,
// or an early dismissal resolves false and the caller grants nothing.

import {MobileAds, RewardedAdLoader} from 'yandex-mobile-ads';

// DEMO units — replace with the real unit IDs for production.
const AD_UNIT_REWARDED = 'demo-rewarded-yandex';
export const AD_UNIT_BANNER = 'demo-banner-yandex';

let initialized = false;

// Called once at app startup (App.tsx). Safe to call more than once — the SDK
// is only initialized on the first successful run.
export async function initAds(): Promise<void> {
    if (initialized) return;
    try {
        // Consent flags must be set before initialize() so the very first ad
        // request already respects them.
        //
        // setUserConsent(false) = no personal data collected for targeting,
        // i.e. the same "non-personalized ads only" stance the app had before.
        // Flip to true once a real consent dialog is shown to GDPR users.
        MobileAds.setUserConsent(false);
        // The app never asks for location permission, so location is off too.
        MobileAds.setLocationConsent(false);
        // Not a kids' app — leave COPPA/age restriction off.
        MobileAds.setAgeRestrictedUser(false);
        await MobileAds.initialize();
        initialized = true;
    } catch {
        // Leave initialized=false so a later call can retry; showRewardedAd()
        // still works because it loads its own ad instance on demand.
    }
}

// Loads a fresh rewarded ad and shows it as soon as it's ready.
// Resolves true only if the user earned the reward, false on any failure,
// no-fill, or early dismissal.
export async function showRewardedAd(): Promise<boolean> {
    let ad;
    try {
        // A loader per request keeps the flow simple: no stale ad is ever shown
        // and nothing has to be kept alive between "Watch Ad" taps.
        const loader = await RewardedAdLoader.create();
        ad = await loader.loadAd({adUnitId: AD_UNIT_REWARDED});
    } catch {
        // Create/load failure or no fill — the caller grants nothing.
        return false;
    }

    const rewarded = ad;
    return new Promise<boolean>(resolve => {
        let settled = false;
        let earned = false;

        const finish = (value: boolean) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        rewarded.onRewarded = () => {
            earned = true;
        };
        // onAdDismissed fires after the user closes the ad; `earned` tells us
        // whether they reached the reward point before closing. The SDK tears
        // down its own listeners when the native ad object is released, so
        // there's nothing to unsubscribe here.
        rewarded.onAdDismissed = () => {
            finish(earned);
        };
        rewarded.onAdFailedToShow = () => {
            finish(false);
        };

        rewarded.show().catch(() => {
            finish(false);
        });
    });
}
