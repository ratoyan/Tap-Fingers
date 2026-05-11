import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '../../components/ui/Logo/Logo.tsx';
import styles from './Splash.style.ts';

const PARTICLES = Array.from({length: 14}, (_, i) => ({
    id:    i,
    angle: (i / 14) * 360,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#CE93D8', '#FF8C42', '#7fff7f', '#00E5FF'][i % 7],
    size:  4 + (i % 4) * 2.5,
    dist:  100 + (i % 4) * 35,
}));

const STARS = Array.from({length: 30}, (_, i) => ({
    id:    i,
    x:     5 + (i * 97.3) % 90,
    y:     3 + (i * 63.7) % 90,
    size:  1 + (i % 3),
    delay: (i * 200) % 2000,
    dur:   1500 + (i % 3) * 800,
}));

interface Props {
    onFinish: () => void;
}

export default function Splash({onFinish}: Props) {
    const exitOpacity      = useRef(new Animated.Value(1)).current;
    const logoY            = useRef(new Animated.Value(-140)).current;
    const logoScale        = useRef(new Animated.Value(0.5)).current;
    const logoOpacity      = useRef(new Animated.Value(0)).current;
    const titleOpacity     = useRef(new Animated.Value(0)).current;
    const titleScale       = useRef(new Animated.Value(0.6)).current;
    const subtitleOpacity  = useRef(new Animated.Value(0)).current;
    const subtitleY        = useRef(new Animated.Value(16)).current;
    const glowAnim         = useRef(new Animated.Value(0)).current;
    const ringScale        = useRef(new Animated.Value(0.6)).current;
    const ringOpacity      = useRef(new Animated.Value(0)).current;
    const starAnims        = useRef(STARS.map(() => new Animated.Value(0))).current;
    const particleAnims    = useRef(PARTICLES.map(() => ({
        dist:    new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale:   new Animated.Value(0),
    }))).current;

    useEffect(() => {
        // Stars twinkle
        starAnims.forEach((anim, i) => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, {toValue: 1, duration: STARS[i].dur, delay: STARS[i].delay, useNativeDriver: true}),
                Animated.timing(anim, {toValue: 0.15, duration: STARS[i].dur, useNativeDriver: true}),
            ])).start();
        });

        // Logo enters with spring bounce
        Animated.parallel([
            Animated.spring(logoY,       {toValue: 0, friction: 6, tension: 55, useNativeDriver: true}),
            Animated.spring(logoScale,   {toValue: 1, friction: 5, tension: 50, useNativeDriver: true}),
            Animated.timing(logoOpacity, {toValue: 1, duration: 350, useNativeDriver: true}),
        ]).start(() => {
            // Ring pulse on logo land
            Animated.parallel([
                Animated.spring(ringScale,   {toValue: 1.8, friction: 4, tension: 40, useNativeDriver: true}),
                Animated.timing(ringOpacity, {toValue: 0,   duration: 700, useNativeDriver: true}),
            ]).start();

            // Particles burst
            burstParticles();

            // Title slides in
            Animated.parallel([
                Animated.spring(titleScale,   {toValue: 1,  friction: 5, tension: 65, useNativeDriver: true}),
                Animated.timing(titleOpacity, {toValue: 1,  duration: 380, useNativeDriver: true}),
            ]).start();

            // Glow pulse loop
            Animated.loop(Animated.sequence([
                Animated.timing(glowAnim, {toValue: 1, duration: 850, useNativeDriver: true}),
                Animated.timing(glowAnim, {toValue: 0, duration: 850, useNativeDriver: true}),
            ])).start();

            // Subtitle
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(subtitleOpacity, {toValue: 1, duration: 500, useNativeDriver: true}),
                    Animated.spring(subtitleY,       {toValue: 0, friction: 7, tension: 60, useNativeDriver: true}),
                ]).start();
            }, 320);

            // Fade out and finish
            setTimeout(() => {
                Animated.timing(exitOpacity, {
                    toValue:  0,
                    duration: 650,
                    easing:   Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }).start(() => onFinish());
            }, 2400);
        });
    }, []);

    function burstParticles() {
        particleAnims.forEach(a => {
            a.dist.setValue(0);
            a.opacity.setValue(0);
            a.scale.setValue(0);
        });
        Animated.parallel(particleAnims.map(a => Animated.parallel([
            Animated.timing(a.dist,    {toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
            Animated.sequence([
                Animated.timing(a.opacity, {toValue: 1, duration: 180, useNativeDriver: true}),
                Animated.timing(a.opacity, {toValue: 0, duration: 700, delay: 180, useNativeDriver: true}),
            ]),
            Animated.spring(a.scale, {toValue: 1, friction: 4, tension: 80, useNativeDriver: true}),
        ]))).start();
    }

    const titleGlow = glowAnim.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]});

    return (
        <Animated.View style={[styles.container, {opacity: exitOpacity}]}>
            <LinearGradient
                colors={['#060010', '#120028', '#06000e']}
                start={{x: 0.2, y: 0}}
                end={{x: 0.8, y: 1}}
                style={StyleSheet.absoluteFill}
            />

            {/* Stars */}
            {starAnims.map((anim, i) => (
                <Animated.View key={`star-${i}`} pointerEvents="none" style={{
                    position:        'absolute',
                    left:            `${STARS[i].x}%` as any,
                    top:             `${STARS[i].y}%` as any,
                    width:           STARS[i].size,
                    height:          STARS[i].size,
                    borderRadius:    STARS[i].size / 2,
                    backgroundColor: '#fff',
                    opacity:         anim,
                }}/>
            ))}

            {/* Particle burst container */}
            <View style={styles.particleOrigin} pointerEvents="none">
                {particleAnims.map((a, i) => {
                    const rad = (PARTICLES[i].angle * Math.PI) / 180;
                    const tx  = a.dist.interpolate({inputRange: [0, 1], outputRange: [0, Math.cos(rad) * PARTICLES[i].dist]});
                    const ty  = a.dist.interpolate({inputRange: [0, 1], outputRange: [0, Math.sin(rad) * PARTICLES[i].dist]});
                    return (
                        <Animated.View key={`p-${i}`} style={{
                            position:        'absolute',
                            width:           PARTICLES[i].size,
                            height:          PARTICLES[i].size,
                            borderRadius:    PARTICLES[i].size / 2,
                            backgroundColor: PARTICLES[i].color,
                            opacity:         a.opacity,
                            transform:       [{translateX: tx}, {translateY: ty}, {scale: a.scale}],
                        }}/>
                    );
                })}
            </View>

            {/* Logo with ring pulse */}
            <View style={styles.logoWrapper}>
                <Animated.View style={[styles.ring, {
                    transform: [{scale: ringScale}],
                    opacity:   ringOpacity,
                }]}/>
                <Animated.View style={{
                    opacity:   logoOpacity,
                    transform: [{translateY: logoY}, {scale: logoScale}],
                }}>
                    <Logo width={250} height={250}/>
                </Animated.View>
            </View>

            {/* Title */}
            <Animated.Text
                allowFontScaling={false}
                style={[styles.title, {
                    opacity:   Animated.multiply(titleOpacity, titleGlow),
                    transform: [{scale: titleScale}],
                }]}
            >
                TapFingers
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text allowFontScaling={false} style={[styles.subtitle, {
                opacity:   subtitleOpacity,
                transform: [{translateY: subtitleY}],
            }]}>
                ✦  Tap. Play. Win.  ✦
            </Animated.Text>
        </Animated.View>
    );
}

