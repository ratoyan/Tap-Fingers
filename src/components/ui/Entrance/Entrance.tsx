import React, {useCallback, useRef} from 'react';
import {Animated, Easing, StyleProp, ViewStyle} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';

// ── Focus-driven entrance wrapper ───────────────────────────────────────────
// Wraps any subtree in a fade + slide (+ optional zoom) that replays every time
// the screen regains focus, so coming back from a round feels like arriving on
// the menu rather than a static jump cut. Stagger a group by handing each child
// an increasing `delay`.
//
// Everything runs on the native driver (opacity + transform only), so the
// animation keeps its frame rate while Home does its focus work — profile
// refresh, wheel prefetch, config sync — on the JS thread.

/** The side the element starts on: 'below' drops in from under its final spot. */
type Direction = 'below' | 'above' | 'left' | 'right' | 'none';

interface EntranceProps {
    children: React.ReactNode;
    /** ms before this element starts moving. Stagger a list with `index * step`. */
    delay?: number;
    from?: Direction;
    /** Travel distance in dp. */
    distance?: number;
    /** Starting scale — leave at 1 for a pure slide. */
    scaleFrom?: number;
    duration?: number;
    style?: StyleProp<ViewStyle>;
    /** Pass 'box-none' when this wrapper is a full-screen layer over content. */
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

function Entrance({
    children,
    delay = 0,
    from = 'below',
    distance = 26,
    scaleFrom = 1,
    duration = 420,
    style,
    pointerEvents,
}: EntranceProps) {
    const t = useRef(new Animated.Value(0)).current;      // 0 → 1 entrance

    useFocusEffect(
        useCallback(() => {
            t.setValue(0);

            const anim = Animated.timing(t, {
                toValue: 1,
                duration,
                delay,
                // A touch of overshoot so the element settles into place instead
                // of stopping dead — the difference between "moved" and "landed".
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            });

            anim.start();

            return () => anim.stop();
        }, [t, delay, duration]),
    );

    // Fades in over the first half of the travel: fully opaque before the
    // overshoot, so the bounce reads as motion rather than a flicker.
    const opacity = t.interpolate({
        inputRange: [0, 0.55],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const slide = t.interpolate({
        inputRange: [0, 1],
        outputRange: [from === 'above' || from === 'left' ? -distance : distance, 0],
    });

    const transform: any[] = [];
    if (from === 'left' || from === 'right') {
        transform.push({translateX: slide});
    } else if (from !== 'none') {
        transform.push({translateY: slide});
    }
    if (scaleFrom !== 1) {
        transform.push({scale: t.interpolate({inputRange: [0, 1], outputRange: [scaleFrom, 1]})});
    }

    return (
        <Animated.View style={[style, {opacity, transform}]} pointerEvents={pointerEvents}>
            {children}
        </Animated.View>
    );
}

export default Entrance;
