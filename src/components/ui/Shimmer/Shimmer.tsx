import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ── Shimmer ─────────────────────────────────────────────────────────────────
// A loading placeholder in the game's own neon idiom rather than the usual grey
// content-site skeleton: a purple-tinted block that breathes, with a cyan-to-
// magenta band raking across it on the diagonal.
//
// The look is borrowed from things already on screen — the card's neon frame
// (#00f5ff → #f0f) and the -18° gloss sweep used on the shop items, the notice
// card and the lucky wheel. A flat white sweep read as a different app's
// loading state parked inside this one.
//
// Three layers, all native-drivable:
//
//   base   static purple tint + faint neon rim
//   glow   a neon wash whose opacity breathes, so the block is alive between
//          sweeps instead of sitting dead until the band comes round again
//   band   the raking highlight
//
// Built with a translating gradient rather than a masked one: react-native has
// no MaskedView without another native dependency, and the band only ever runs
// over a flat block, so a plain overlay looks identical.

const SWEEP_MS = 1150;
const BREATHE_MS = 1400;
// The band is wider than its travel is long, so the highlight is always partly
// on the block — it reads as a sweep rather than a dot crossing an empty bar.
const BAND_RATIO = 0.7;
// Matches the gloss sweeps elsewhere in the app.
const BAND_SKEW = '-18deg';

interface ShimmerProps {
    width: number | string;
    height: number;
    radius?: number;
    /** Staggers the sweep so a column of rows doesn't pulse in lockstep. */
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

function Shimmer({width, height, radius = 8, delay = 0, style}: ShimmerProps) {
    const sweep = useRef(new Animated.Value(0)).current;
    const breathe = useRef(new Animated.Value(0)).current;
    // Measured so the band can travel exactly edge to edge. Percentage widths
    // are common here, so the number isn't known until layout.
    const [w, setW] = useState(typeof width === 'number' ? width : 0);

    useEffect(() => {
        if (w === 0) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(sweep, {
                    toValue: 1,
                    duration: SWEEP_MS,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                // Snap back off-screen instantly; the visible travel is one-way.
                Animated.timing(sweep, {toValue: 0, duration: 0, useNativeDriver: true}),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [w, delay]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(breathe, {
                    toValue: 1,
                    duration: BREATHE_MS,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(breathe, {
                    toValue: 0,
                    duration: BREATHE_MS,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [delay]);

    const bandW = Math.max(1, w * BAND_RATIO);
    const translateX = sweep.interpolate({
        inputRange: [0, 1],
        outputRange: [-bandW, w],
    });
    const glowOpacity = breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.7],
    });

    return (
        <View
            onLayout={typeof width === 'number' ? undefined : e => setW(e.nativeEvent.layout.width)}
            style={[
                {
                    width: width as ViewStyle['width'],
                    height,
                    borderRadius: radius,
                    backgroundColor: 'rgba(75,0,130,0.35)',
                    borderWidth: 1,
                    borderColor: 'rgba(142,45,226,0.28)',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            {/* Breathing neon wash — keeps the block alive between sweeps. */}
            <Animated.View style={[StyleSheet.absoluteFillObject, {opacity: glowOpacity}]} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(142,45,226,0.20)', 'rgba(74,0,224,0.10)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={{flex: 1}}
                />
            </Animated.View>

            {w > 0 && (
                <Animated.View
                    style={{
                        width: bandW,
                        // Taller than the block so the skew doesn't clip a
                        // triangle out of the top and bottom corners.
                        height: '160%',
                        top: '-30%',
                        transform: [{translateX}, {skewX: BAND_SKEW}],
                    }}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={[
                            'rgba(0,245,255,0)',
                            'rgba(0,245,255,0.22)',
                            'rgba(255,0,255,0.26)',
                            'rgba(255,0,255,0)',
                        ]}
                        locations={[0, 0.38, 0.62, 1]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={{flex: 1}}
                    />
                </Animated.View>
            )}
        </View>
    );
}

export default React.memo(Shimmer);
