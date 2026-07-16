import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {ms} from '../../../utils/responsive.ts';
import {GOLD, GRADIENT_LIGHT, WHITE} from '../../../constants/colors.ts';

// Last entry is the go-signal — it animates outward instead of shrinking away.
const STEPS = ['3', '2', '1', 'GO!'];

interface CountdownOverlayProps {
    /** Fires once the last step has finished animating out. */
    onFinish: () => void;
}

/**
 * The 3·2·1·GO! that plays before the game resumes from the pause menu.
 *
 * Mount it to run it (`{counting && <CountdownOverlay .../>}`) — it has no
 * `visible` prop on purpose, so every run starts from a fresh step index
 * instead of racing a reset effect against the animation.
 *
 * It also covers the arena while it counts, which keeps taps off the frozen
 * boxes until the game is actually live again.
 */
export default function CountdownOverlay({onFinish}: CountdownOverlayProps) {
    const [index, setIndex] = useState(0);

    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;

    // The animation callback fires after a parent re-render could have handed
    // us a new onFinish; always call the latest one.
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;

    useEffect(() => {
        const isGo = index === STEPS.length - 1;

        // Numbers slam in from oversized; "GO!" pops up from small and flies out.
        scale.setValue(isGo ? 0.4 : 2.4);
        opacity.setValue(0);
        ringScale.setValue(0.35);
        ringOpacity.setValue(0.5);

        // The settle bounce runs on its own, deliberately NOT inside the timeline
        // below: a spring only reports "finished" once its tail has fully damped,
        // which would stretch each step to ~2s and make 3·2·1 crawl. The fade-out
        // timing on `scale` interrupts whatever is left of it, right on cue.
        const pop = Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
        });
        pop.start();

        // Fixed-length timeline — this is what paces the count.
        const anim = Animated.parallel([
            Animated.sequence([
                Animated.timing(opacity, {toValue: 1, duration: 140, useNativeDriver: true}),
                Animated.delay(isGo ? 200 : 360),
                Animated.parallel([
                    Animated.timing(opacity, {toValue: 0, duration: 200, useNativeDriver: true}),
                    Animated.timing(scale, {
                        toValue: isGo ? 1.7 : 0.6,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
            // Shockwave ring — expands and fades under each step.
            Animated.parallel([
                Animated.timing(ringScale, {toValue: 1.6, duration: 620, useNativeDriver: true}),
                Animated.timing(ringOpacity, {toValue: 0, duration: 620, useNativeDriver: true}),
            ]),
        ]);

        anim.start(({finished}) => {
            // Stopped early (unmounted mid-step) — don't resume or advance.
            if (!finished) return;
            if (isGo) onFinishRef.current();
            else setIndex(i => i + 1);
        });

        return () => {
            pop.stop();
            anim.stop();
        };
    }, [index, scale, opacity, ringScale, ringOpacity]);

    const isGo = index === STEPS.length - 1;

    return (
        <View style={styles.overlay}>
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.ring,
                    isGo && styles.ringGo,
                    {opacity: ringOpacity, transform: [{scale: ringScale}]},
                ]}
            />
            <Animated.Text
                allowFontScaling={false}
                style={[
                    styles.number,
                    isGo && styles.go,
                    {opacity, transform: [{scale}]},
                ]}
            >
                {STEPS[index]}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    // Not pointerEvents="none": while it counts, it also keeps taps off the
    // frozen boxes underneath.
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
    },
    ring: {
        position: 'absolute',
        width: ms(170),
        height: ms(170),
        borderRadius: ms(85),
        borderWidth: 4,
        borderColor: GRADIENT_LIGHT,
    },
    ringGo: {
        borderColor: GOLD,
    },
    number: {
        color: WHITE,
        fontSize: ms(120),
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: GRADIENT_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 24,
    },
    go: {
        color: GOLD,
        fontSize: ms(76),
        letterSpacing: 6,
        textShadowColor: GOLD,
    },
});
