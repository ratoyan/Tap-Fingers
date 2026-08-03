import React, {useEffect, useState} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {BannerAdSize, BannerView} from 'yandex-mobile-ads';
import {AD_UNIT_BANNER} from '../../../utils/ads.ts';
import {useConfigStore} from '../../../store/configStore.ts';
import {DARK_PURPLE} from '../../../constants/colors.ts';

// Persistent anchored banner pinned to the bottom of the app. Rendered once in
// App.tsx as a sibling of the navigator, so it stays put across screen changes.
// DEMO unit (AD_UNIT_BANNER) — swap for the real banner unit before release.
//
// The size is resolved natively (async) before the view can be rendered. We use
// the adaptive "inline" size capped at BANNER_MAX_HEIGHT instead of the sticky
// size, because sticky picks its own height from the screen (up to ~90dp) and
// eats too much of the play area — inline keeps the strip short.
//
// The wrapper collapses to zero height until the ad reports a successful load,
// so no empty bar is reserved when there's no fill (or the ad errors).

// Max banner height in dp. 50 is the smallest height Yandex serves for an
// adaptive inline banner; raise it if the ad strip looks too cramped.
const BANNER_MAX_HEIGHT = 50;

export default function BottomBanner() {
    const [loaded, setLoaded] = useState(false);
    const [adSize, setAdSize] = useState<BannerAdSize | null>(null);
    const {width} = useWindowDimensions();
    // Respect the admin global ad switch — same flag that hides the "watch ad"
    // buttons. When ads are off, render nothing at all.
    const adsEnabled = useConfigStore(s => s.adsEnabled);

    useEffect(() => {
        if (!adsEnabled) return;
        let cancelled = false;
        // A new width means a new banner request, so hide the old one until the
        // re-sized ad reports back.
        setLoaded(false);
        BannerAdSize.inlineSize(Math.floor(width), BANNER_MAX_HEIGHT)
            .then(size => {
                if (!cancelled) setAdSize(size);
            })
            .catch(() => {
                // Size couldn't be computed (SDK missing / unsupported platform)
                // — leave the banner unrendered rather than guessing a height.
            });
        return () => {
            cancelled = true;
        };
    }, [adsEnabled, width]);

    if (!adsEnabled || !adSize) return null;

    return (
        <View style={loaded ? styles.wrap : styles.hidden}>
            <BannerView
                size={adSize}
                adRequest={{adUnitId: AD_UNIT_BANNER}}
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
