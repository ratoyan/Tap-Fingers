import React, {useEffect, useRef, useState} from "react";
import {Animated, Easing, View, ViewStyle} from "react-native";

// icons
import FullHeart from "../../../assets/icons/FullHeart.tsx";
import EmptyHeart from "../../../assets/icons/EmptyHeart.tsx";

interface HeartsProps {
    viewStyle?: ViewStyle;
    length?: number;
    emptyCount?: number;
    animating?: boolean;
    size?: number;
}

const HEART_SIZE = 26;

// Shards thrown out when a heart breaks. Fixed (not random) so every lost heart
// bursts the same way — the player learns the shape of the animation instead of
// seeing a different scatter each time. dx/dy are fractions of the heart size.
const SHARDS = [
    {dx: -1.15, dy: -0.55, size: 5, color: '#FF5252', spin: -140},
    {dx: 1.05, dy: -0.70, size: 4, color: '#FF1744', spin: 160},
    {dx: -1.30, dy: 0.45, size: 3.5, color: '#B00020', spin: -95},
    {dx: 1.35, dy: 0.35, size: 4.5, color: '#FF8A80', spin: 120},
    {dx: -0.35, dy: 1.15, size: 3, color: '#FF1744', spin: -60},
    {dx: 0.45, dy: 1.25, size: 4, color: '#FF5252', spin: 80},
];

// One heart in the row. It owns its own break/refill animation, so the parent
// only has to say whether the slot is empty — no "which index just flipped"
// bookkeeping, and a heart lost while another is still shattering animates
// independently.
function HeartSlot({isEmpty, size}: {isEmpty: boolean; size: number}) {
    // `breaking` keeps the two halves mounted for the length of the shatter,
    // after the slot underneath has already switched to the empty heart.
    const [breaking, setBreaking] = useState(false);
    // Skip the animation on the very first render: a screen that mounts with
    // hearts already lost (revive, retry) shouldn't replay every break at once.
    const mountedRef = useRef(false);

    const burst = useRef(new Animated.Value(0)).current;   // 0 → 1 over the shatter
    const punch = useRef(new Animated.Value(1)).current;   // scale of the intact heart
    const refill = useRef(new Animated.Value(1)).current;  // scale when a heart comes back

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }

        if (isEmpty) {
            setBreaking(true);
            burst.setValue(0);
            punch.setValue(1);
            Animated.sequence([
                // A short squeeze-and-swell before it gives: the heart "takes
                // the hit" first, so the shatter reads as a consequence.
                Animated.timing(punch, {toValue: 1.38, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true}),
                Animated.timing(punch, {toValue: 1.1, duration: 60, easing: Easing.linear, useNativeDriver: true}),
                Animated.timing(burst, {toValue: 1, duration: 430, easing: Easing.out(Easing.quad), useNativeDriver: true}),
            ]).start(({finished}) => {
                if (finished) setBreaking(false);
            });
        } else {
            // Won a heart back (pickup, boss defeat, revive) — pop it in.
            setBreaking(false);
            refill.setValue(0.2);
            Animated.spring(refill, {toValue: 1, friction: 4, tension: 90, useNativeDriver: true}).start();
        }
    }, [isEmpty]);

    const half = size / 2;

    // Halves part ways and fall; opacity holds for the first third so the crack
    // is visible before they fade.
    const leftTransform = [
        {translateX: burst.interpolate({inputRange: [0, 1], outputRange: [0, -size * 0.55]})},
        {translateY: burst.interpolate({inputRange: [0, 1], outputRange: [0, size * 0.75]})},
        {rotate: burst.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-48deg']})},
    ];
    const rightTransform = [
        {translateX: burst.interpolate({inputRange: [0, 1], outputRange: [0, size * 0.58]})},
        {translateY: burst.interpolate({inputRange: [0, 1], outputRange: [0, size * 0.9]})},
        {rotate: burst.interpolate({inputRange: [0, 1], outputRange: ['0deg', '55deg']})},
    ];
    const halfOpacity = burst.interpolate({inputRange: [0, 0.35, 1], outputRange: [1, 1, 0]});

    return (
        <View style={{width: size, height: size}}>
            {/* Base layer: the empty socket once lost, the intact heart otherwise. */}
            <Animated.View style={{transform: [{scale: isEmpty ? 1 : refill}]}}>
                {isEmpty ? <EmptyHeart size={size}/> : <FullHeart size={size}/>}
            </Animated.View>

            {breaking && (
                <View pointerEvents="none" style={{position: 'absolute', left: 0, top: 0, width: size, height: size}}>
                    {/* Left half — the full heart drawn inside a half-width
                        window, so the tear runs straight down the middle. */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: half,
                            height: size,
                            overflow: 'hidden',
                            opacity: halfOpacity,
                            transform: [{scale: punch}, ...leftTransform],
                        }}
                    >
                        <FullHeart size={size}/>
                    </Animated.View>

                    {/* Right half — same artwork shifted left inside its window. */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: half,
                            width: half,
                            height: size,
                            overflow: 'hidden',
                            opacity: halfOpacity,
                            transform: [{scale: punch}, ...rightTransform],
                        }}
                    >
                        <View style={{marginLeft: -half}}>
                            <FullHeart size={size}/>
                        </View>
                    </Animated.View>

                    {/* Shards */}
                    {SHARDS.map((s, i) => (
                        <Animated.View
                            key={i}
                            style={{
                                position: 'absolute',
                                left: half - s.size / 2,
                                top: half - s.size / 2,
                                width: s.size,
                                height: s.size,
                                borderRadius: s.size / 3,
                                backgroundColor: s.color,
                                opacity: burst.interpolate({inputRange: [0, 0.15, 1], outputRange: [0, 1, 0]}),
                                transform: [
                                    {translateX: burst.interpolate({inputRange: [0, 1], outputRange: [0, size * s.dx]})},
                                    {translateY: burst.interpolate({inputRange: [0, 1], outputRange: [0, size * s.dy]})},
                                    {rotate: burst.interpolate({inputRange: [0, 1], outputRange: ['0deg', `${s.spin}deg`]})},
                                    {scale: burst.interpolate({inputRange: [0, 0.6, 1], outputRange: [1, 1, 0.4]})},
                                ],
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

function Hearts({viewStyle, length = 7, emptyCount = 0, animating = false, size = HEART_SIZE}: HeartsProps) {
    // Sized from `length`, not a hardcoded 7 — a shorter row used to index past
    // the end of the array and fall back to a throwaway Animated.Value.
    const shakeAnims = useRef<Animated.Value[]>([]).current;
    while (shakeAnims.length < length) shakeAnims.push(new Animated.Value(0));

    useEffect(() => {
        if (!animating) return;

        const animations = shakeAnims.slice(0, length).map((anim, i) =>
            Animated.sequence([
                Animated.delay(i * 60),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {toValue: -6, duration: 60, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 6, duration: 60, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: -4, duration: 50, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 4, duration: 50, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 0, duration: 40, easing: Easing.linear, useNativeDriver: true}),
                    ]),
                    {iterations: 3}
                ),
            ])
        );

        Animated.parallel(animations).start(() => {
            shakeAnims.forEach(a => a.setValue(0));
        });
    }, [animating, length]);

    return (
        <View style={viewStyle}>
            {Array.from({length}).map((_, index) => {
                const isEmpty = index >= length - emptyCount;
                return (
                    <Animated.View key={index} style={{transform: [{translateX: shakeAnims[index]}]}}>
                        <HeartSlot isEmpty={isEmpty} size={size}/>
                    </Animated.View>
                );
            })}
        </View>
    );
}

export default Hearts;
