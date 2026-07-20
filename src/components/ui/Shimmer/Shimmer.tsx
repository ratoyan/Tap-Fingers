import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleProp, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ── Shimmer ─────────────────────────────────────────────────────────────────
// A loading placeholder: a dim block with a light band sweeping across it.
//
// Used instead of a centred spinner on the screens that load a list. A spinner
// says "something is happening"; a skeleton says "this is what is coming, and
// roughly how much of it" — which on a slow connection is the difference
// between a blank purple screen and a page that is visibly about to fill in.
//
// Built with a translating gradient rather than a masked one: react-native has
// no MaskedView without another native dependency, and the band only ever runs
// over a flat block, so a plain overlay looks identical.

const SWEEP_MS = 1150;
// The band is wider than its travel is long, so the highlight is always partly
// on the block — it reads as a sweep rather than a dot crossing an empty bar.
const BAND_RATIO = 0.7;

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
    // Measured so the band can travel exactly edge to edge. Percentage widths
    // are common here, so the number isn't known until layout.
    const [w, setW] = React.useState(typeof width === 'number' ? width : 0);

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

    const bandW = Math.max(1, w * BAND_RATIO);
    const translateX = sweep.interpolate({
        inputRange: [0, 1],
        outputRange: [-bandW, w],
    });

    return (
        <View
            onLayout={typeof width === 'number' ? undefined : e => setW(e.nativeEvent.layout.width)}
            style={[
                {
                    width: width as ViewStyle['width'],
                    height,
                    borderRadius: radius,
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            {w > 0 && (
                <Animated.View
                    style={{
                        width: bandW,
                        height: '100%',
                        transform: [{translateX}],
                    }}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={[
                            'rgba(255,255,255,0)',
                            'rgba(255,255,255,0.13)',
                            'rgba(255,255,255,0)',
                        ]}
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
