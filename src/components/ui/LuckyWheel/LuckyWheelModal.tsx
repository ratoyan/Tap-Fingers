import React, {useEffect, useRef, useState} from 'react';
import {
    Animated,
    Easing,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, G, Line, Path, Text as SvgText} from 'react-native-svg';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import {useGlobalStore} from '../../../store/globalStore.ts';
import styles from './LuckyWheelModal.style.ts';

const WHEEL_SIZE    = 310;
const CENTER        = WHEEL_SIZE / 2;
const RADIUS        = CENTER - 6;
const NUM_SPINS     = 6;
const SEGMENT_ANGLE = 45;
const N             = 8;

const SEGMENTS = [
    {label: '10',  icon: '🪙', type: 'coins',  value: 10,  fill: '#9c4d00', textColor: '#FFD700'},
    {label: '+1',  icon: '💣', type: 'bomb',   value: 1,   fill: '#6b1200', textColor: '#FF8C42'},
    {label: '25',  icon: '🪙', type: 'coins',  value: 25,  fill: '#7a3b00', textColor: '#FFD700'},
    {label: '+1',  icon: '🛡️', type: 'shield', value: 1,   fill: '#003d5c', textColor: '#00E5FF'},
    {label: '50',  icon: '🪙', type: 'coins',  value: 50,  fill: '#9c4d00', textColor: '#FFD700'},
    {label: '+1',  icon: '🐌', type: 'slow',   value: 1,   fill: '#3b006e', textColor: '#CE93D8'},
    {label: '5',   icon: '🪙', type: 'coins',  value: 5,   fill: '#2a2a2a', textColor: '#bbb'},
    {label: '100', icon: '🌟', type: 'coins',  value: 100, fill: '#5c1000', textColor: '#FF6B00'},
];

function polarToCart(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

function slicePath(i: number) {
    const startDeg = i * SEGMENT_ANGLE;
    const endDeg   = startDeg + SEGMENT_ANGLE;
    const start    = polarToCart(CENTER, CENTER, RADIUS, startDeg);
    const end      = polarToCart(CENTER, CENTER, RADIUS, endDeg);
    return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

function sliceTextPos(i: number, r: number) {
    const midDeg = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const rad    = ((midDeg - 90) * Math.PI) / 180;
    return {x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad)};
}

const SPARKLES = Array.from({length: 10}, (_, i) => ({
    id:    i,
    x:     10 + Math.random() * 340,
    y:     10 + Math.random() * 580,
    size:  Math.random() * 3 + 1.5,
    dur:   1200 + Math.random() * 2000,
    delay: Math.random() * 2000,
}));

const RING_DOTS = Array.from({length: 24}, (_, i) => {
    const deg = (i / 24) * 360;
    const rad = ((deg - 90) * Math.PI) / 180;
    const r   = CENTER - 1.5;
    return {
        x:   CENTER + r * Math.cos(rad),
        y:   CENTER + r * Math.sin(rad),
        seg: Math.floor(i / 3) % N,
    };
});

interface Props {
    visible: boolean;
    onClose: () => void;
    onSpinComplete?: () => void;
}

export default function LuckyWheelModal({visible, onClose, onSpinComplete}: Props) {
    const {addCoins} = useGlobalStore();

    const spinAnim      = useRef(new Animated.Value(0)).current;
    const spinValue     = useRef(0);
    const modalScale    = useRef(new Animated.Value(0.82)).current;
    const modalOpacity  = useRef(new Animated.Value(0)).current;
    const pulseAnim     = useRef(new Animated.Value(1)).current;
    const resultScale   = useRef(new Animated.Value(0)).current;
    const resultOpacity = useRef(new Animated.Value(0)).current;
    const pointerBob    = useRef(new Animated.Value(0)).current;
    const sparkleAnims  = useRef(SPARKLES.map(() => new Animated.Value(0))).current;
    const pulseLoopRef        = useRef<Animated.CompositeAnimation | null>(null);
    const pointerLoopRef      = useRef<Animated.CompositeAnimation | null>(null);
    const sparkleLoopRefs     = useRef<Animated.CompositeAnimation[]>([]);

    const [spinning, setSpinning] = useState(false);
    const [result,   setResult]   = useState<typeof SEGMENTS[0] | null>(null);
    const [canSpin,  setCanSpin]  = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (visible) {
            checkCanSpin();
            setResult(null);
            resultScale.setValue(0);
            resultOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(modalScale,   {toValue: 1, friction: 7, tension: 70, useNativeDriver: true}),
                Animated.timing(modalOpacity, {toValue: 1, duration: 220, useNativeDriver: true}),
            ]).start();

            sparkleLoopRefs.current.forEach(l => l.stop());
            sparkleLoopRefs.current = sparkleAnims.map((anim, i) => {
                const loop = Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {toValue: 1, duration: SPARKLES[i].dur, delay: SPARKLES[i].delay, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 0, duration: SPARKLES[i].dur, useNativeDriver: true}),
                    ])
                );
                loop.start();
                return loop;
            });

            pointerLoopRef.current?.stop();
            pointerLoopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pointerBob, {toValue: 6, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                    Animated.timing(pointerBob, {toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                ])
            );
            pointerLoopRef.current.start();
        } else {
            modalScale.setValue(0.82);
            modalOpacity.setValue(0);
            sparkleLoopRefs.current.forEach(l => l.stop());
            pointerLoopRef.current?.stop();
        }
    }, [visible]);

    useEffect(() => {
        pulseLoopRef.current?.stop();
        if (canSpin && !spinning) {
            pulseLoopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {toValue: 1.12, duration: 700, useNativeDriver: true}),
                    Animated.timing(pulseAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
                ])
            );
            pulseLoopRef.current.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => { pulseLoopRef.current?.stop(); };
    }, [canSpin, spinning]);

    async function checkCanSpin() {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        if (!raw) { setCanSpin(true); return; }
        const last = new Date(raw);
        const now  = new Date();
        const same =
            last.getFullYear() === now.getFullYear() &&
            last.getMonth()    === now.getMonth()    &&
            last.getDate()     === now.getDate();
        if (same) {
            setCanSpin(false);
            const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${h}h ${m}m`);
        } else {
            setCanSpin(true);
        }
    }

    async function applyReward(seg: typeof SEGMENTS[0]) {
        if (seg.type === 'coins') {
            addCoins(seg.value);
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.COIN);
            const cur = raw ? JSON.parse(raw) : 0;
            await AsyncStorage.setItem(STORAGE_KEYS.COIN, JSON.stringify(cur + seg.value));
        } else {
            const key = seg.type === 'bomb'   ? STORAGE_KEYS.BOMB_COUNT
                : seg.type === 'shield' ? STORAGE_KEYS.SHIELD_COUNT
                    : STORAGE_KEYS.SLOW_COUNT;
            const raw = await AsyncStorage.getItem(key);
            const cur = raw ? JSON.parse(raw) : 0;
            await AsyncStorage.setItem(key, JSON.stringify(cur + 1));
        }
    }

    function spin() {
        if (spinning || !canSpin) return;
        const winnerIdx   = Math.floor(Math.random() * SEGMENTS.length);
        const jitter      = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.4);
        const toTop       = 360 - winnerIdx * SEGMENT_ANGLE + jitter;
        const total       = spinValue.current + NUM_SPINS * 360 + toTop;
        spinValue.current = total;

        setSpinning(true);
        setResult(null);

        Animated.timing(spinAnim, {
            toValue:         total,
            duration:        4200,
            easing:          Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(async () => {
            setSpinning(false);
            setResult(SEGMENTS[winnerIdx]);
            setCanSpin(false);
            Animated.parallel([
                Animated.spring(resultScale,   {toValue: 1, friction: 4, tension: 80, useNativeDriver: true}),
                Animated.timing(resultOpacity, {toValue: 1, duration: 300, useNativeDriver: true}),
            ]).start();
            await applyReward(SEGMENTS[winnerIdx]);
            await AsyncStorage.setItem(STORAGE_KEYS.LUCKY_SPIN_DATE, new Date().toISOString());
            onSpinComplete?.();
        });
    }

    const rotate = spinAnim.interpolate({
        inputRange:  [0, 360],
        outputRange: ['0deg', '360deg'],
        extrapolate: 'extend',
    });

    const rewardLabel = result
        ? result.type === 'coins'  ? `+${result.value} Coins!`
            : result.type === 'bomb'   ? '+1 Bomb!'
                : result.type === 'shield' ? '+1 Shield!'
                    : '+1 Slow Mo!'
        : '';

    const isActive = canSpin && !spinning;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.backdrop, {opacity: modalOpacity}]}>

                {/* Sparkles */}
                {sparkleAnims.map((anim, i) => (
                    <Animated.View key={i} pointerEvents="none" style={[
                        styles.sparkleDot,
                        {
                            left:         SPARKLES[i].x,
                            top:          SPARKLES[i].y,
                            width:        SPARKLES[i].size,
                            height:       SPARKLES[i].size,
                            borderRadius: SPARKLES[i].size / 2,
                            opacity:      anim,
                        },
                    ]}/>
                ))}

                <Animated.View style={[styles.cardWrapper, {transform: [{scale: modalScale}]}]}>
                    <LinearGradient
                        colors={['#1a0038', '#0a0018', '#1a0038']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.card}
                    >
                        {/* Header */}
                        <Text style={styles.title}>🎡  LUCKY WHEEL</Text>

                        {isActive && (
                            <Text style={styles.subtitle}>Your daily free spin!</Text>
                        )}
                        {!canSpin && !spinning && (
                            <Text style={styles.subtitleDisabled}>⏰  Next spin in {timeLeft}</Text>
                        )}

                        <View style={styles.divider}/>

                        {/* Pointer */}
                        <Animated.View style={[styles.pointerWrapper, {transform: [{translateY: pointerBob}]}]}>
                            <View style={styles.pointerArrow}/>
                        </Animated.View>

                        {/* ─── SVG Wheel ─── */}
                        <View style={{width: WHEEL_SIZE, height: WHEEL_SIZE, marginVertical: 6}}>

                            <Animated.View style={{
                                position:     'absolute',
                                width:        WHEEL_SIZE,
                                height:       WHEEL_SIZE,
                                borderRadius: CENTER,
                                transform:    [{rotate}],
                            }}>
                                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                    {/* Pie sectors */}
                                    {SEGMENTS.map((seg, i) => (
                                        <Path key={`slice-${i}`} d={slicePath(i)} fill={seg.fill}/>
                                    ))}

                                    {/* Spoke dividers */}
                                    {SEGMENTS.map((_, i) => {
                                        const deg = i * SEGMENT_ANGLE;
                                        const pt  = polarToCart(CENTER, CENTER, RADIUS, deg);
                                        return (
                                            <Line
                                                key={`line-${i}`}
                                                x1={CENTER} y1={CENTER}
                                                x2={pt.x}   y2={pt.y}
                                                stroke="rgba(255,215,0,0.22)"
                                                strokeWidth={1.5}
                                            />
                                        );
                                    })}

                                    {/* Outer gold ring */}
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#FFD700" strokeWidth={5}/>
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS - 8} fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth={1}/>

                                    {/* Ring decorative dots */}
                                    {RING_DOTS.map((dot, i) => (
                                        <Circle key={`dot-${i}`} cx={dot.x} cy={dot.y} r={3} fill={SEGMENTS[dot.seg].textColor} opacity={0.85}/>
                                    ))}

                                    {/* Emoji + label per segment */}
                                    {SEGMENTS.map((seg, i) => {
                                        const iconPos  = sliceTextPos(i, RADIUS * 0.62);
                                        const labelPos = sliceTextPos(i, RADIUS * 0.35);
                                        return (
                                            <G key={`txt-${i}`}>
                                                <SvgText x={iconPos.x} y={iconPos.y + 7} textAnchor="middle" fontSize={24} fill={seg.textColor}>
                                                    {seg.icon}
                                                </SvgText>
                                                <SvgText x={labelPos.x} y={labelPos.y + 5} textAnchor="middle" fontSize={11} fontWeight="bold" fill={seg.textColor} fillOpacity={0.9}>
                                                    {seg.label}
                                                </SvgText>
                                            </G>
                                        );
                                    })}

                                    {/* Hub */}
                                    <Circle cx={CENTER} cy={CENTER} r={42} fill="#1a0035"/>
                                    <Circle cx={CENTER} cy={CENTER} r={42} fill="none" stroke="#FFD700" strokeWidth={2.5} strokeOpacity={0.6}/>
                                </Svg>
                            </Animated.View>

                            {/* Fixed SPIN button */}
                            <View style={[styles.spinButtonFixed, {left: CENTER - 38, top: CENTER - 38}]}>
                                <Animated.View style={{transform: [{scale: isActive ? pulseAnim : 1}]}}>
                                    <TouchableOpacity onPress={spin} disabled={spinning || !canSpin} activeOpacity={0.82}>
                                        <LinearGradient
                                            colors={isActive ? ['#FFE566', '#FFD700', '#cc8800'] : ['#333', '#222', '#111']}
                                            style={[
                                                styles.spinGradient,
                                                isActive ? styles.spinGradientActive : styles.spinGradientInactive,
                                            ]}
                                        >
                                            <Text style={[
                                                styles.spinText,
                                                spinning ? styles.spinTextSpinning
                                                    : isActive ? styles.spinTextActive
                                                        : styles.spinTextInactive,
                                            ]}>
                                                {spinning ? '⟳' : canSpin ? 'SPIN!' : '✓'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </View>

                        {/* Result banner */}
                        {result && (
                            <Animated.View style={[styles.resultWrapper, {opacity: resultOpacity, transform: [{scale: resultScale}]}]}>
                                <LinearGradient
                                    colors={['rgba(255,215,0,0.2)', 'rgba(255,80,0,0.1)', 'rgba(255,215,0,0.2)']}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                    style={styles.resultGradient}
                                >
                                    <Text style={styles.resultYouWon}>YOU WON</Text>
                                    <Text style={styles.resultIcon}>{result.icon}</Text>
                                    <Text style={styles.resultLabel}>{rewardLabel}</Text>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {/* Cooldown box */}
                        {!canSpin && !spinning && !result && (
                            <View style={styles.cooldownBox}>
                                <Text style={styles.cooldownIcon}>⏳</Text>
                                <Text style={styles.cooldownText}>
                                    Come back in {timeLeft} for your next spin!
                                </Text>
                            </View>
                        )}

                        {/* Close */}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>CLOSE</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
