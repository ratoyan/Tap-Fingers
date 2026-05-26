import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

// ── Decorative, non-interactive layer for the Welcome screen ────────────────
// Glowing drifting orbs + twinkling sparkles + slow floating emojis. Sits
// behind the content (absolute fill, pointerEvents="none") over the purple
// gradient to give the auth screen a premium, eye-catching feel.

const ORBS = [
    {colors: ['rgba(218,112,214,0.45)', 'transparent'] as [string, string], size: width * 0.95, x: -width * 0.28, y: height * 0.04, range: 30, dur: 5200, delay: 0},
    {colors: ['rgba(255,105,180,0.38)', 'transparent'] as [string, string], size: width * 0.80, x: width * 0.48,  y: height * 0.30, range: 42, dur: 6000, delay: 600},
    {colors: ['rgba(147,112,219,0.42)', 'transparent'] as [string, string], size: width * 1.00, x: width * 0.02,  y: height * 0.60, range: 36, dur: 5600, delay: 1200},
    {colors: ['rgba(255,215,0,0.18)',  'transparent'] as [string, string], size: width * 0.55, x: width * 0.58,  y: height * 0.74, range: 26, dur: 4800, delay: 300},
];

const SPARKS = Array.from({length: 22}, (_, i) => ({
    id:    i,
    x:     Math.random() * width,
    y:     Math.random() * height,
    size:  Math.random() * 2.5 + 1.5,
    color: Math.random() > 0.5 ? '#ffffff' : '#FFD700',
    dur:   1200 + Math.random() * 2200,
    delay: Math.random() * 2200,
}));

const FLOATERS = [
    {emoji: '✨', x: width * 0.12, y: height * 0.15, size: 22, dur: 3400, delay: 0},
    {emoji: '🪙', x: width * 0.82, y: height * 0.20, size: 24, dur: 3800, delay: 500},
    {emoji: '⭐', x: width * 0.80, y: height * 0.56, size: 20, dur: 3200, delay: 900},
    {emoji: '✨', x: width * 0.08, y: height * 0.62, size: 18, dur: 3600, delay: 1300},
    {emoji: '💫', x: width * 0.50, y: height * 0.07, size: 22, dur: 4000, delay: 700},
];

export default function WelcomeBackground() {
    const orbAnims   = useRef(ORBS.map(() => ({o: new Animated.Value(0.3), t: new Animated.Value(0)}))).current;
    const sparkAnims = useRef(SPARKS.map(() => new Animated.Value(Math.random()))).current;
    const floatAnims = useRef(FLOATERS.map(() => ({t: new Animated.Value(0), o: new Animated.Value(0.5)}))).current;

    useEffect(() => {
        orbAnims.forEach((a, i) => {
            Animated.loop(Animated.sequence([
                Animated.parallel([
                    Animated.timing(a.o, {toValue: 0.85, duration: ORBS[i].dur, delay: ORBS[i].delay, useNativeDriver: true}),
                    Animated.timing(a.t, {toValue: 1,    duration: ORBS[i].dur, useNativeDriver: true}),
                ]),
                Animated.parallel([
                    Animated.timing(a.o, {toValue: 0.3, duration: ORBS[i].dur, useNativeDriver: true}),
                    Animated.timing(a.t, {toValue: 0,   duration: ORBS[i].dur, useNativeDriver: true}),
                ]),
            ])).start();
        });

        sparkAnims.forEach((a, i) => {
            Animated.loop(Animated.sequence([
                Animated.timing(a, {toValue: 1,    duration: SPARKS[i].dur, delay: SPARKS[i].delay, useNativeDriver: true}),
                Animated.timing(a, {toValue: 0.1,  duration: SPARKS[i].dur, useNativeDriver: true}),
            ])).start();
        });

        floatAnims.forEach((a, i) => {
            Animated.loop(Animated.sequence([
                Animated.parallel([
                    Animated.timing(a.t, {toValue: 1, duration: FLOATERS[i].dur, delay: FLOATERS[i].delay, useNativeDriver: true}),
                    Animated.timing(a.o, {toValue: 1, duration: FLOATERS[i].dur, useNativeDriver: true}),
                ]),
                Animated.parallel([
                    Animated.timing(a.t, {toValue: 0,   duration: FLOATERS[i].dur, useNativeDriver: true}),
                    Animated.timing(a.o, {toValue: 0.4, duration: FLOATERS[i].dur, useNativeDriver: true}),
                ]),
            ])).start();
        });
    }, []);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {orbAnims.map((a, i) => (
                <Animated.View
                    key={`orb${i}`}
                    style={{
                        position: 'absolute',
                        left:   ORBS[i].x,
                        top:    ORBS[i].y,
                        width:  ORBS[i].size,
                        height: ORBS[i].size,
                        opacity: a.o,
                        transform: [{
                            translateY: a.t.interpolate({inputRange: [0, 1], outputRange: [ORBS[i].range, -ORBS[i].range]}),
                        }],
                    }}
                >
                    <LinearGradient colors={ORBS[i].colors} style={{flex: 1, borderRadius: ORBS[i].size / 2}} />
                </Animated.View>
            ))}

            {sparkAnims.map((a, i) => (
                <Animated.View
                    key={`spk${i}`}
                    style={{
                        position: 'absolute',
                        left:   SPARKS[i].x,
                        top:    SPARKS[i].y,
                        width:  SPARKS[i].size,
                        height: SPARKS[i].size,
                        borderRadius: SPARKS[i].size / 2,
                        backgroundColor: SPARKS[i].color,
                        opacity: a,
                    }}
                />
            ))}

            {floatAnims.map((a, i) => (
                <Animated.Text
                    key={`flt${i}`}
                    allowFontScaling={false}
                    style={{
                        position: 'absolute',
                        left: FLOATERS[i].x,
                        top:  FLOATERS[i].y,
                        fontSize: FLOATERS[i].size,
                        opacity: a.o,
                        transform: [{
                            translateY: a.t.interpolate({inputRange: [0, 1], outputRange: [10, -18]}),
                        }],
                    }}
                >
                    {FLOATERS[i].emoji}
                </Animated.Text>
            ))}
        </View>
    );
}
