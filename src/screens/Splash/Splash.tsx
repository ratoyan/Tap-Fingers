import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Logo from '../../components/ui/Logo/Logo.tsx';
import styles from './Splash.style.ts';

const TITLE  = 'TapFingers'.split('');
const GOLD   = '#FFD700';

const PARTICLES = Array.from({length: 22}, (_, i) => ({
    angle: (i / 22) * 360,
    color: ['#FFD700','#FF6B6B','#4ECDC4','#CE93D8','#FF8C42','#7fff7f','#00E5FF','#FF69B4'][i % 8],
    size:  3 + (i % 5) * 2.2,
    dist:  80 + (i % 5) * 42,
}));

const STARS = Array.from({length: 44}, (_, i) => ({
    x:    5  + (i * 97.3)  % 90,
    y:    3  + (i * 63.7)  % 90,
    size: 1  + (i % 3),
    gold: i % 7 === 0,
    delay:(i * 173) % 2400,
    dur:  1200 + (i % 5) * 500,
}));

const ORBS = [
    {left: -50,   top: '12%', size: 220, color: 'rgba(120,0,255,0.08)' },
    {left: '58%', top: '48%', size: 180, color: 'rgba(255,80,0,0.05)'  },
    {left: '15%', top: '70%', size: 200, color: 'rgba(0,140,255,0.06)' },
];

interface Props { onFinish: () => void; }

export default function Splash({onFinish}: Props) {
    const exit          = useRef(new Animated.Value(1)).current;
    const logoY         = useRef(new Animated.Value(-180)).current;
    const logoScale     = useRef(new Animated.Value(0.35)).current;
    const logoOpacity   = useRef(new Animated.Value(0)).current;
    const logoFloat     = useRef(new Animated.Value(0)).current;
    const glowAnim      = useRef(new Animated.Value(0)).current;
    const ring1S        = useRef(new Animated.Value(0.85)).current;
    const ring1O        = useRef(new Animated.Value(0)).current;
    const ring2S        = useRef(new Animated.Value(0.85)).current;
    const ring2O        = useRef(new Animated.Value(0)).current;
    const ring3S        = useRef(new Animated.Value(0.85)).current;
    const ring3O        = useRef(new Animated.Value(0)).current;
    const lineScale     = useRef(new Animated.Value(0)).current;
    const subtitleO     = useRef(new Animated.Value(0)).current;
    const subtitleY     = useRef(new Animated.Value(14)).current;
    const progressAnim  = useRef(new Animated.Value(0)).current;
    const shootX        = useRef(new Animated.Value(-120)).current;
    const shootO        = useRef(new Animated.Value(0)).current;

    const starAnims     = useRef(STARS.map(() => new Animated.Value(0))).current;
    const orbAnims      = useRef(ORBS.map(() => new Animated.Value(0))).current;
    const particleAnims = useRef(PARTICLES.map(() => ({
        dist:    new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale:   new Animated.Value(0),
    }))).current;
    const charAnims     = useRef(TITLE.map(() => ({
        opacity: new Animated.Value(0),
        y:       new Animated.Value(20),
    }))).current;

    useEffect(() => {
        // Stars twinkle
        starAnims.forEach((anim, i) => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, {toValue: 1, duration: STARS[i].dur, delay: STARS[i].delay, useNativeDriver: true}),
                Animated.timing(anim, {toValue: 0.1, duration: STARS[i].dur, useNativeDriver: true}),
            ])).start();
        });

        // Orbs drift
        orbAnims.forEach((anim, i) => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, {toValue: 1, duration: 3200 + i * 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
                Animated.timing(anim, {toValue: 0, duration: 3200 + i * 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
            ])).start();
        });

        // Shooting star
        setTimeout(() => {
            Animated.sequence([
                Animated.timing(shootO, {toValue: 1,   duration: 80,  useNativeDriver: true}),
                Animated.timing(shootX, {toValue: 520,  duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true}),
                Animated.timing(shootO, {toValue: 0,   duration: 180, useNativeDriver: true}),
            ]).start();
        }, 900);

        // Logo entrance
        Animated.parallel([
            Animated.spring(logoY,       {toValue: 0, friction: 6,   tension: 52, useNativeDriver: true}),
            Animated.spring(logoScale,   {toValue: 1, friction: 5,   tension: 48, useNativeDriver: true}),
            Animated.timing(logoOpacity, {toValue: 1, duration: 320,              useNativeDriver: true}),
        ]).start(() => {
            // 3 ripple rings staggered
            const ripple = (s: Animated.Value, o: Animated.Value, delay: number) => {
                setTimeout(() => {
                    s.setValue(0.85); o.setValue(0.75);
                    Animated.parallel([
                        Animated.timing(s, {toValue: 2.6, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
                        Animated.timing(o, {toValue: 0,   duration: 900, useNativeDriver: true}),
                    ]).start();
                }, delay);
            };
            ripple(ring1S, ring1O, 0);
            ripple(ring2S, ring2O, 220);
            ripple(ring3S, ring3O, 440);

            // Particles burst
            burstParticles();

            // Logo float loop
            Animated.loop(Animated.sequence([
                Animated.timing(logoFloat, {toValue: -12, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
                Animated.timing(logoFloat, {toValue: 0,   duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
            ])).start();

            // Glow pulse
            Animated.loop(Animated.sequence([
                Animated.timing(glowAnim, {toValue: 1, duration: 900, useNativeDriver: true}),
                Animated.timing(glowAnim, {toValue: 0, duration: 900, useNativeDriver: true}),
            ])).start();

            // Letters cascade
            Animated.stagger(52, charAnims.map(a => Animated.parallel([
                Animated.timing(a.opacity, {toValue: 1, duration: 200, useNativeDriver: true}),
                Animated.spring(a.y,       {toValue: 0, friction: 7, tension: 90, useNativeDriver: true}),
            ]))).start();

            // Underline draw
            setTimeout(() => {
                Animated.spring(lineScale, {toValue: 1, friction: 5, tension: 55, useNativeDriver: true}).start();
            }, 560);

            // Subtitle
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(subtitleO, {toValue: 1, duration: 550, useNativeDriver: true}),
                    Animated.spring(subtitleY, {toValue: 0, friction: 7,   tension: 60,  useNativeDriver: true}),
                ]).start();
            }, 760);

            // Progress bar
            setTimeout(() => {
                Animated.timing(progressAnim, {
                    toValue: 1, duration: 2100,
                    easing:  Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }).start();
            }, 250);

            // Exit fade
            setTimeout(() => {
                Animated.timing(exit, {
                    toValue: 0, duration: 700,
                    easing:  Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }).start(() => onFinish());
            }, 2950);
        });
    }, []);

    function burstParticles() {
        particleAnims.forEach(a => { a.dist.setValue(0); a.opacity.setValue(0); a.scale.setValue(0); });
        Animated.parallel(particleAnims.map(a => Animated.parallel([
            Animated.timing(a.dist,    {toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
            Animated.sequence([
                Animated.timing(a.opacity, {toValue: 1, duration: 140, useNativeDriver: true}),
                Animated.timing(a.opacity, {toValue: 0, duration: 860, delay: 140, useNativeDriver: true}),
            ]),
            Animated.spring(a.scale, {toValue: 1, friction: 4, tension: 80, useNativeDriver: true}),
        ]))).start();
    }

    const titleGlow   = glowAnim.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]});
    const progressW   = progressAnim.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']});

    return (
        <Animated.View style={[styles.container, {opacity: exit}]}>
            {/* Deep space background */}
            <LinearGradient
                colors={['#03000c', '#0b001e', '#160035', '#0b001e', '#03000c']}
                start={{x: 0.1, y: 0}}
                end={{x: 0.9, y: 1}}
                style={StyleSheet.absoluteFill}
            />

            {/* Soft glow orbs */}
            {orbAnims.map((anim, i) => {
                const ty = anim.interpolate({inputRange: [0, 1], outputRange: [0, -22]});
                return (
                    <Animated.View key={`orb-${i}`} pointerEvents="none" style={{
                        position:        'absolute',
                        left:            ORBS[i].left as any,
                        top:             ORBS[i].top as any,
                        width:           ORBS[i].size,
                        height:          ORBS[i].size,
                        borderRadius:    ORBS[i].size / 2,
                        backgroundColor: ORBS[i].color,
                        transform:       [{translateY: ty}],
                    }}/>
                );
            })}

            {/* Stars */}
            {starAnims.map((anim, i) => (
                <Animated.View key={`s-${i}`} pointerEvents="none" style={{
                    position:        'absolute',
                    left:            `${STARS[i].x}%` as any,
                    top:             `${STARS[i].y}%` as any,
                    width:           STARS[i].size,
                    height:          STARS[i].size,
                    borderRadius:    STARS[i].size / 2,
                    backgroundColor: STARS[i].gold ? GOLD : '#ffffff',
                    opacity:         anim,
                }}/>
            ))}

            {/* Shooting star */}
            <Animated.View pointerEvents="none" style={{
                position:        'absolute',
                top:             '20%',
                left:            0,
                width:           90,
                height:          1.5,
                borderRadius:    1,
                backgroundColor: '#fff',
                opacity:         shootO,
                transform:       [{translateX: shootX}, {rotate: '12deg'}],
            }}/>

            {/* Particles burst */}
            <View style={styles.particleOrigin} pointerEvents="none">
                {particleAnims.map((a, i) => {
                    const rad = (PARTICLES[i].angle * Math.PI) / 180;
                    const tx  = a.dist.interpolate({inputRange: [0,1], outputRange: [0, Math.cos(rad)*PARTICLES[i].dist]});
                    const ty  = a.dist.interpolate({inputRange: [0,1], outputRange: [0, Math.sin(rad)*PARTICLES[i].dist]});
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

            {/* Logo + ripple rings */}
            <View style={styles.logoArea}>
                {/* Static halo */}
                <View style={styles.haloRing}/>

                {/* 3 ripple rings */}
                {[{s: ring1S, o: ring1O, c: GOLD},
                  {s: ring2S, o: ring2O, c: 'rgba(255,180,80,0.6)'},
                  {s: ring3S, o: ring3O, c: 'rgba(255,255,255,0.25)'}
                ].map((r, i) => (
                    <Animated.View key={`r-${i}`} style={[styles.rippleRing, {
                        borderColor: r.c,
                        transform:   [{scale: r.s}],
                        opacity:     r.o,
                    }]}/>
                ))}

                {/* Logo */}
                <Animated.View style={{
                    opacity:   logoOpacity,
                    transform: [{translateY: logoY}, {scale: logoScale}],
                }}>
                    <Animated.View style={{transform: [{translateY: logoFloat}]}}>
                        <Logo width={200} height={200}/>
                    </Animated.View>
                </Animated.View>
            </View>

            {/* Letter-by-letter title */}
            <View style={styles.titleRow}>
                {charAnims.map((a, i) => (
                    <Animated.Text
                        key={`c-${i}`}
                        allowFontScaling={false}
                        style={[styles.titleChar, {
                            color:           i < 3 ? GOLD : '#ffffff',
                            textShadowColor: i < 3 ? 'rgba(255,160,0,0.9)' : 'rgba(160,80,255,0.7)',
                            textShadowRadius: 14,
                            textShadowOffset: {width: 0, height: 0},
                            opacity:         Animated.multiply(a.opacity, titleGlow) as any,
                            transform:       [{translateY: a.y}],
                        }]}
                    >
                        {TITLE[i]}
                    </Animated.Text>
                ))}
            </View>

            {/* Underline sweep */}
            <Animated.View style={[styles.underline, {transform: [{scaleX: lineScale}]}]}/>

            {/* Subtitle */}
            <Animated.Text allowFontScaling={false} style={[styles.subtitle, {
                opacity:   subtitleO,
                transform: [{translateY: subtitleY}],
            }]}>
                ✦  Tap. Play. Win.  ✦
            </Animated.Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, {width: progressW}]}>
                    <LinearGradient
                        colors={['#996600', GOLD, '#ffe566', GOLD, '#996600']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>

            {/* Version */}
            <Animated.Text allowFontScaling={false} style={[styles.versionText, {opacity: subtitleO}]}>
                v1.0.0
            </Animated.Text>
        </Animated.View>
    );
}
