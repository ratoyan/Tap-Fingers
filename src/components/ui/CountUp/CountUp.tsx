import React, {useCallback, useRef, useState} from 'react';
import {Animated, Easing, StyleProp, Text, TextStyle} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';

// ── CountUp ─────────────────────────────────────────────────────────────────
// A number that rolls up to its value instead of appearing already final, so a
// screenful of stats reads as something being tallied. Replays on every screen
// focus, matching Entrance — the two are meant to be seen together.
//
// This is the one animation in the app that deliberately does NOT use the native
// driver: the text has to be re-rendered on each step, which only a JS listener
// can do. It's one short run of a single value per tile, and it ends by pinning
// the exact figure so no rounding artefact can survive the animation.

interface CountUpProps {
    value: number;
    duration?: number;
    /** Stagger a row of tiles with `index * step`, like Entrance's delay. */
    delay?: number;
    style?: StyleProp<TextStyle>;
}

function CountUp({value, duration = 900, delay = 0, style}: CountUpProps) {
    const t = useRef(new Animated.Value(0)).current;
    const [shown, setShown] = useState(value);

    useFocusEffect(
        useCallback(() => {
            // Nothing to roll up to — skip the animation rather than flash a 0.
            if (!value) {
                setShown(value);
                return;
            }
            t.setValue(0);
            setShown(0);

            const id = t.addListener(({value: progress}) => {
                setShown(Math.round(progress * value));
            });
            const anim = Animated.timing(t, {
                toValue: 1,
                duration,
                delay,
                // Fast off the mark, long settle — the same deceleration the rest
                // of the screen's entrance uses.
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            });
            anim.start(() => setShown(value));

            return () => {
                anim.stop();
                t.removeListener(id);
                // Leaving mid-roll must not strand a half-counted number on a
                // screen the player can scroll straight back to.
                setShown(value);
            };
        }, [t, value, duration, delay]),
    );

    return (
        <Text allowFontScaling={false} style={style} numberOfLines={1}>
            {shown}
        </Text>
    );
}

export default React.memo(CountUp);
