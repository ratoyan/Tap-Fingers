import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleProp, ViewStyle} from 'react-native';

// ── Mount-driven entrance wrapper ───────────────────────────────────────────
// Wraps any subtree in a fade + slide (+ optional zoom) that plays once, when
// the subtree mounts. Stagger a group by handing each child an increasing
// `delay`.
//
// Deliberately NOT focus-driven: on a stack screen that stays mounted behind a
// push (Home), replaying on every focus meant the whole menu re-dealt itself
// each time the player came back from a round — an arrival animation for a
// screen that never left. Screens that are popped on the way out (Profile,
// Shop) unmount anyway, so for them mount and focus are the same moment.
//
// Everything runs on the native driver (opacity + transform only), so the
// animation keeps its frame rate while Home does its focus work — profile
// refresh, wheel prefetch, config sync — on the JS thread.

/** The side the element starts on: 'below' drops in from under its final spot. */
type Direction = 'below' | 'above' | 'left' | 'right' | 'none';

// Shared with MenuButton so everything on a screen decelerates alike.
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);

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

    useEffect(
        () => {
            t.setValue(0);

            const anim = Animated.timing(t, {
                toValue: 1,
                duration,
                delay,
                // The same decelerating curve MenuButton uses: quick off the
                // mark, long tail, no overshoot. It replaced an Easing.back —
                // the bounce read as bounce, and on a screen you see dozens of
                // times a session that gets old faster than it charms.
                easing: SETTLE,
                useNativeDriver: true,
                // Native-driven animations don't register with InteractionManager
                // on their own. Opting in lets a screen park its heavy focus work
                // behind the entrance — see useDeferredFocusEffect.
                isInteraction: true,
            });

            anim.start();

            return () => anim.stop();
        },
        // Mount only — every call site passes literals, so these never change.
        [t, delay, duration],
    );

    // Fades a little behind the travel rather than ahead of it — with no
    // overshoot to cover, finishing the fade early would leave the tail of the
    // move looking like nothing was happening.
    const opacity = t.interpolate({
        inputRange: [0, 0.7],
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
