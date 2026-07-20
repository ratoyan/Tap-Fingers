import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

// ── Stars ─────────────────────────────────────────────────────────────────
const STARS = Array.from({length: 26}, (_, i) => ({
    id:       i,
    x:        Math.random() * width,
    y:        Math.random() * height,
    size:     Math.random() * 2.5 + 1,
    duration: 1200 + Math.random() * 2200,
    delay:    Math.random() * 2000,
}));

function StarsBackground() {
    const anims = useRef(STARS.map(() => new Animated.Value(Math.random()))).current;

    useEffect(() => {
        // Every loop in this file is collected and stopped on unmount. They used
        // to be started and dropped: an Animated.loop with no retained handle
        // keeps driving after the component is gone, so each Play mount left
        // another full set of them running for the rest of the app's life.
        const loops = anims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {toValue: 1,   duration: STARS[i].duration, delay: STARS[i].delay, useNativeDriver: true}),
                    Animated.timing(anim, {toValue: 0.08, duration: STARS[i].duration, useNativeDriver: true}),
                ])
            ),
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, []);

    return (
        <View style={{position: 'absolute', width, height, backgroundColor: '#020012'}}>
            {STARS.map((star, i) => (
                <Animated.View
                    key={star.id}
                    style={{
                        position:        'absolute',
                        left:            star.x,
                        top:             star.y,
                        width:           star.size,
                        height:          star.size,
                        borderRadius:    star.size / 2,
                        backgroundColor: '#ffffff',
                        opacity:         anims[i],
                    }}
                />
            ))}
        </View>
    );
}

// ── Aurora ────────────────────────────────────────────────────────────────
const AURORA_BLOBS = [
    {colors: ['rgba(0,230,118,0.45)', 'transparent'],   x: -60,          y: height * 0.15, delay: 0},
    {colors: ['rgba(40,120,255,0.40)', 'transparent'],  x: width * 0.2,  y: height * 0.35, delay: 700},
    {colors: ['rgba(180,0,255,0.35)', 'transparent'],   x: width * 0.5,  y: height * 0.20, delay: 1400},
];

function AuroraBackground() {
    const anims = useRef(
        AURORA_BLOBS.map(() => ({
            opacity:    new Animated.Value(0.25),
            translateY: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        const loops = anims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(anim.opacity,    {toValue: 0.85, duration: 3200, delay: AURORA_BLOBS[i].delay, useNativeDriver: true}),
                        Animated.timing(anim.translateY, {toValue: -40,  duration: 3200, useNativeDriver: true}),
                    ]),
                    Animated.parallel([
                        Animated.timing(anim.opacity,    {toValue: 0.20, duration: 3200, useNativeDriver: true}),
                        Animated.timing(anim.translateY, {toValue: 40,   duration: 3200, useNativeDriver: true}),
                    ]),
                ])
            ),
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, []);

    return (
        <View style={{position: 'absolute', width, height, backgroundColor: '#010008'}}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={{
                        position:  'absolute',
                        left:      AURORA_BLOBS[i].x,
                        top:       AURORA_BLOBS[i].y,
                        width:     width * 0.8,
                        height:    height * 0.38,
                        opacity:   anim.opacity,
                        transform: [{translateY: anim.translateY}],
                    }}
                >
                    <LinearGradient
                        colors={AURORA_BLOBS[i].colors}
                        style={{flex: 1, borderRadius: 220}}
                    />
                </Animated.View>
            ))}
        </View>
    );
}

// ── Inferno ───────────────────────────────────────────────────────────────
const FIRE_COLORS = ['#ff1a00', '#ff5500', '#ff8800', '#ffcc00'];
const FIRE_PARTICLES = Array.from({length: 18}, (_, i) => ({
    id:       i,
    x:        Math.random() * width,
    size:     Math.random() * 14 + 5,
    duration: 1400 + Math.random() * 1600,
    delay:    Math.random() * 2200,
    color:    FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
}));

function InfernoBackground() {
    const anims = useRef(
        FIRE_PARTICLES.map(() => ({
            y:       new Animated.Value(height + 20),
            opacity: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        // Hand-rolled loop (each pass re-seeds the start position, which
        // Animated.loop can't do), so it needs its own kill switch: the
        // `cancelled` flag stops the recursion and `running` holds the pass
        // that's in flight. Previously neither existed — `.start(() => loop())`
        // with nothing retained is unstoppable by construction, so 18 particles
        // per Play mount kept re-arming themselves forever.
        let cancelled = false;
        const timers: ReturnType<typeof setTimeout>[] = [];
        const running: (Animated.CompositeAnimation | null)[] = anims.map(() => null);

        anims.forEach((anim, i) => {
            const dur = FIRE_PARTICLES[i].duration;
            const loop = () => {
                if (cancelled) return;
                anim.y.setValue(height + 20);
                anim.opacity.setValue(0.9);
                const pass = Animated.parallel([
                    Animated.timing(anim.y,       {toValue: height * 0.25, duration: dur, useNativeDriver: true}),
                    Animated.sequence([
                        Animated.timing(anim.opacity, {toValue: 1,  duration: dur * 0.25, useNativeDriver: true}),
                        Animated.timing(anim.opacity, {toValue: 0,  duration: dur * 0.75, useNativeDriver: true}),
                    ]),
                ]);
                running[i] = pass;
                // `finished` is false when the pass was stopped rather than
                // completing, which is the other half of the kill switch.
                pass.start(({finished}) => { if (finished && !cancelled) loop(); });
            };
            timers.push(setTimeout(loop, FIRE_PARTICLES[i].delay));
        });

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
            running.forEach(pass => pass?.stop());
        };
    }, []);

    return (
        <View style={{position: 'absolute', width, height, backgroundColor: '#0d0000'}}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={FIRE_PARTICLES[i].id}
                    style={{
                        position:        'absolute',
                        left:            FIRE_PARTICLES[i].x,
                        top:             0,
                        width:           FIRE_PARTICLES[i].size,
                        height:          FIRE_PARTICLES[i].size,
                        borderRadius:    FIRE_PARTICLES[i].size / 2,
                        backgroundColor: FIRE_PARTICLES[i].color,
                        opacity:         anim.opacity,
                        transform:       [{translateY: anim.y}],
                    }}
                />
            ))}
        </View>
    );
}

// ── Matrix ────────────────────────────────────────────────────────────────
const COLS      = 9;
const COL_W     = width / COLS;
const TRAIL_LEN = 5;

const MATRIX_DROPS = Array.from({length: COLS}, (_, col) =>
    Array.from({length: TRAIL_LEN}, (__, j) => ({
        id:       `${col}-${j}`,
        x:        col * COL_W + COL_W / 2 - 3,
        duration: 1800 + Math.random() * 2000,
        delay:    Math.random() * 3500 + j * 350,
        opacity:  1 - j * 0.17,
    }))
).flat();

function MatrixBackground() {
    const anims = useRef(MATRIX_DROPS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Same unstoppable-recursion fix as Inferno above, at 45 drops.
        let cancelled = false;
        const running: (Animated.CompositeAnimation | null)[] = anims.map(() => null);

        anims.forEach((anim, i) => {
            const loop = () => {
                if (cancelled) return;
                anim.setValue(0);
                const pass = Animated.timing(anim, {
                    toValue:  1,
                    duration: MATRIX_DROPS[i].duration,
                    delay:    MATRIX_DROPS[i].delay,
                    useNativeDriver: true,
                });
                running[i] = pass;
                pass.start(({finished}) => { if (finished && !cancelled) loop(); });
            };
            loop();
        });

        return () => {
            cancelled = true;
            running.forEach(pass => pass?.stop());
        };
    }, []);

    return (
        <View style={{position: 'absolute', width, height, backgroundColor: '#000900'}}>
            {anims.map((anim, i) => {
                const translateY = anim.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [-10, height + 10],
                });
                return (
                    <Animated.View
                        key={MATRIX_DROPS[i].id}
                        style={{
                            position:        'absolute',
                            left:            MATRIX_DROPS[i].x,
                            top:             0,
                            width:           6,
                            height:          6,
                            borderRadius:    3,
                            backgroundColor: '#00ff41',
                            opacity:         MATRIX_DROPS[i].opacity,
                            transform:       [{translateY}],
                        }}
                    />
                );
            })}
        </View>
    );
}

// ── Export ────────────────────────────────────────────────────────────────
interface Props {
    type: string;
}

function AnimatedBackground({type}: Props) {
    switch (type) {
        case 'stars':   return <StarsBackground/>;
        case 'aurora':  return <AuroraBackground/>;
        case 'inferno': return <InfernoBackground/>;
        case 'matrix':  return <MatrixBackground/>;
        default:        return null;
    }
}

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(AnimatedBackground);
