import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_UNIT_BANNER} from '../../../utils/ads.ts';
import {useConfigStore} from '../../../store/configStore.ts';
import {DARK_PURPLE} from '../../../constants/colors.ts';

// Persistent anchored banner pinned to the bottom of the app. Rendered once in
// App.tsx as a sibling of the navigator, so it stays put across screen changes.
// TEST unit (AD_UNIT_BANNER) — swap for the real banner unit before release.
//
// The wrapper collapses to zero height until the ad reports a successful load,
// so no empty bar is reserved when there's no fill (or the ad errors).
export default function BottomBanner() {
    const [loaded, setLoaded] = useState(false);
    // Respect the admin global ad switch — same flag that hides the "watch ad"
    // buttons. When ads are off, render nothing at all.
    const adsEnabled = useConfigStore(s => s.adsEnabled);

    if (!adsEnabled) return null;

    return (
        <View style={loaded ? styles.wrap : styles.hidden}>
            <BannerAd
                unitId={AD_UNIT_BANNER}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{requestNonPersonalizedAdsOnly: true}}
                onAdLoaded={() => setLoaded(true)}
                onAdFailedToLoad={() => setLoaded(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: DARK_PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hidden: {height: 0, overflow: 'hidden'},
});
