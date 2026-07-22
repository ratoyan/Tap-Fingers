// Rewarded-ad gateway for the three "Watch Ad" buttons in the app
// (Home/Shop coin reward, Play lose-screen heart revive, Play free helper).
//
// TEST MODE: every request uses Google's official TestIds.REWARDED unit, so a
// real fill is never served and clicks are safe during development. Swap
// AD_UNIT_REWARDED for the real AdMob unit ID (per platform) before release —
// nothing else here changes.
//
// The reward is granted by the caller ONLY when showRewardedAd() resolves true,
// i.e. the user actually watched to the reward point. A failed load, no fill,
// or an early dismissal resolves false and the caller grants nothing.

import mobileAds, {
    AdEventType,
    MaxAdContentRating,
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

// TEST units — replace with the real per-platform unit IDs for production.
const AD_UNIT_REWARDED = TestIds.REWARDED;
export const AD_UNIT_BANNER = TestIds.BANNER;

let initialized = false;

// Called once at app startup (App.tsx). Safe to call more than once — the SDK
// is only initialized on the first successful run.
export async function initAds(): Promise<void> {
    if (initialized) return;
    try {
        await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.PG,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
        initialized = true;
    } catch {
        // Leave initialized=false so a later call can retry; showRewardedAd()
        // still works because it loads its own ad instance on demand.
    }
}

// Loads a fresh rewarded ad and shows it as soon as it's ready.
// Resolves true only if the user earned the reward, false on any failure,
// no-fill, or early dismissal.
export function showRewardedAd(): Promise<boolean> {
    return new Promise(resolve => {
        let settled = false;
        let earned = false;

        const rewarded = RewardedAd.createForAdRequest(AD_UNIT_REWARDED, {
            requestNonPersonalizedAdsOnly: true,
        });

        const subs: Array<() => void> = [];
        const cleanup = () => {
            subs.forEach(unsub => {
                try {
                    unsub();
                } catch {}
            });
            subs.length = 0;
        };
        const finish = (value: boolean) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        subs.push(
            rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                try {
                    rewarded.show();
                } catch {
                    finish(false);
                }
            }),
        );
        subs.push(
            rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                earned = true;
            }),
        );
        // CLOSED fires after the user dismisses the ad; earned tells us whether
        // they reached the reward point before closing.
        subs.push(
            rewarded.addAdEventListener(AdEventType.CLOSED, () => {
                finish(earned);
            }),
        );
        subs.push(
            rewarded.addAdEventListener(AdEventType.ERROR, () => {
                finish(false);
            }),
        );

        try {
            rewarded.load();
        } catch {
            finish(false);
        }
    });
}
