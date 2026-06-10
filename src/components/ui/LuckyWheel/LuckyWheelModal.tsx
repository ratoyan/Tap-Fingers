import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Modal, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {storage} from '../../../db/kvStore.ts';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, G, Line, Path, Text as SvgText} from 'react-native-svg';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import {useAuthStore} from '../../../store/authStore.ts';
import * as userService from '../../../services/userService.ts';
import {LuckyWheelSegment} from '../../../services/types';
import styles from './LuckyWheelModal.style.ts';

const WHEEL_SIZE    = 310;
const CENTER        = WHEEL_SIZE / 2;
const RADIUS        = CENTER - 6;
const NUM_SPINS     = 6;

// Visual styling per prize type. Segments returned by the server only carry
// {type, value} — colours/icons live here so the admin doesn't need to edit
// hex codes. Alternating fills give the wheel its striped look (one per type).
type SegType = 'coins' | 'bomb' | 'shield' | 'slow';

const TYPE_VISUALS: Record<SegType, {icon: string; textColor: string; fills: string[]}> = {
    coins:  {icon: '🪙',  textColor: '#FFD700', fills: ['#9c4d00', '#7a3b00', '#5c1000', '#2a2a2a']},
    bomb:   {icon: '💣',  textColor: '#FF8C42', fills: ['#6b1200']},
    shield: {icon: '🛡️', textColor: '#00E5FF', fills: ['#003d5c']},
    slow:   {icon: '🐌',  textColor: '#CE93D8', fills: ['#3b006e']},
};

interface WheelSlice {
    index:     number;
    type:      SegType;
    value:     number;
    label:     string;
    icon:      string;
    fill:      string;
    textColor: string;
}

function buildSlices(segments: LuckyWheelSegment[]): WheelSlice[] {
    // Count occurrences of each type so we can rotate through that type's
    // fill palette and avoid two same-shade slices landing next to each other.
    const seenPerType: Record<string, number> = {};
    return segments.map(seg => {
        const t = seg.type as SegType;
        const v = TYPE_VISUALS[t] ?? TYPE_VISUALS.coins;
        const n = (seenPerType[t] = (seenPerType[t] ?? 0) + 1) - 1;
        return {
            index:     seg.index,
            type:      t,
            value:     seg.value,
            label:     t === 'coins' ? String(seg.value) : `+${seg.value}`,
            icon:      v.icon,
            fill:      v.fills[n % v.fills.length],
            textColor: v.textColor,
        };
    });
}

const RESULT_COLORS: Record<string, string[]> = {
    coins:  ['rgba(255,180,0,0.25)',  'rgba(255,100,0,0.12)', 'rgba(255,180,0,0.25)'],
    bomb:   ['rgba(255,80,0,0.25)',   'rgba(180,0,0,0.12)',   'rgba(255,80,0,0.25)'],
    shield: ['rgba(0,200,255,0.25)',  'rgba(0,80,180,0.12)',  'rgba(0,200,255,0.25)'],
    slow:   ['rgba(180,80,255,0.25)', 'rgba(80,0,140,0.12)',  'rgba(180,80,255,0.25)'],
};

const RESULT_GLOW: Record<string, string> = {
    coins: '#FFD700', bomb: '#FF6B00', shield: '#00E5FF', slow: '#CE93D8',
};

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#CE93D8', '#FF8C42', '#7fff7f', '#fff'];
const CONFETTI = Array.from({length: 16}, (_, i) => ({
    id:    i,
    angle: (i / 16) * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:  4 + (i % 3) * 2,
    dist:  110 + (i % 4) * 30,
}));

const SPARKLES = Array.from({length: 10}, (_, i) => ({
    id: i, x: 10 + Math.random() * 340, y: 10 + Math.random() * 580,
    size: Math.random() * 3 + 1.5, dur: 1200 + Math.random() * 2000, delay: Math.random() * 2000,
}));

function polarToCart(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}
function slicePath(i: number, segAngle: number) {
    const startDeg = i * segAngle, endDeg = startDeg + segAngle;
    const start = polarToCart(CENTER, CENTER, RADIUS, startDeg);
    const end   = polarToCart(CENTER, CENTER, RADIUS, endDeg);
    const largeArc = segAngle > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}
function sliceTextPos(i: number, r: number, segAngle: number) {
    const midDeg = i * segAngle + segAngle / 2;
    const rad    = ((midDeg - 90) * Math.PI) / 180;
    return {x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad)};
}
function buildRingDots(slices: WheelSlice[]) {
    const n = slices.length || 1;
    return Array.from({length: 24}, (_, i) => {
        const deg = (i / 24) * 360;
        const rad = ((deg - 90) * Math.PI) / 180;
        const r   = CENTER - 1.5;
        return {x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad), seg: Math.floor(i / 3) % n};
    });
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSpinComplete?: () => void;
}

export default function LuckyWheelModal({visible, onClose, onSpinComplete}: Props) {
    const {t} = useTranslation();
    const patchStats = useAuthStore(s => s.patchStats);

    const spinAnim        = useRef(new Animated.Value(0)).current;
    const spinValue       = useRef(0);
    const modalScale      = useRef(new Animated.Value(0.82)).current;
    const modalOpacity    = useRef(new Animated.Value(0)).current;
    const pulseAnim       = useRef(new Animated.Value(1)).current;
    const resultScale     = useRef(new Animated.Value(0)).current;
    const resultOpacity   = useRef(new Animated.Value(0)).current;
    const pointerBob      = useRef(new Animated.Value(0)).current;
    const spinningIcon    = useRef(new Animated.Value(0)).current;
    const shineAnim       = useRef(new Animated.Value(-1)).current;
    const sparkleAnims    = useRef(SPARKLES.map(() => new Animated.Value(0))).current;
    const confettiAnims   = useRef(CONFETTI.map(() => ({
        dist:    new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale:   new Animated.Value(0),
    }))).current;

    const pulseLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
    const pointerLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
    const sparkleLoopRefs = useRef<Animated.CompositeAnimation[]>([]);
    const spinIconLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const [spinning, setSpinning] = useState(false);
    const [result,   setResult]   = useState<WheelSlice | null>(null);
    const [canSpin,  setCanSpin]  = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
    const [segments, setSegments] = useState<LuckyWheelSegment[] | null>(null);
    const [loadError, setLoadError] = useState(false);

    const slices       = useMemo(() => buildSlices(segments ?? []), [segments]);
    const segmentAngle = slices.length > 0 ? 360 / slices.length : 360;
    const ringDots     = useMemo(() => buildRingDots(slices), [slices]);

    useEffect(() => {
        if (visible) {
            checkCanSpin();
            setResult(null);
            resultScale.setValue(0);
            resultOpacity.setValue(0);

            // Pull the latest wheel layout each time the modal opens, so admin
            // edits show up without an app restart.
            setLoadError(false);
            userService.getLuckyWheelSegments()
                .then(setSegments)
                .catch(() => { setSegments([]); setLoadError(true); });

            Animated.parallel([
                Animated.spring(modalScale,   {toValue: 1, friction: 6, tension: 65, useNativeDriver: true}),
                Animated.timing(modalOpacity, {toValue: 1, duration: 220, useNativeDriver: true}),
            ]).start();

            // Shine sweep
            shineAnim.setValue(-1);
            Animated.loop(
                Animated.timing(shineAnim, {toValue: 2, duration: 2800, delay: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true})
            ).start();

            sparkleLoopRefs.current.forEach(l => l.stop());
            sparkleLoopRefs.current = sparkleAnims.map((anim, i) => {
                const loop = Animated.loop(Animated.sequence([
                    Animated.timing(anim, {toValue: 1, duration: SPARKLES[i].dur, delay: SPARKLES[i].delay, useNativeDriver: true}),
                    Animated.timing(anim, {toValue: 0, duration: SPARKLES[i].dur, useNativeDriver: true}),
                ]));
                loop.start();
                return loop;
            });

            pointerLoopRef.current?.stop();
            pointerLoopRef.current = Animated.loop(Animated.sequence([
                Animated.timing(pointerBob, {toValue: 7, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                Animated.timing(pointerBob, {toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            ]));
            pointerLoopRef.current.start();
        } else {
            modalScale.setValue(0.82);
            modalOpacity.setValue(0);
            sparkleLoopRefs.current.forEach(l => l.stop());
            pointerLoopRef.current?.stop();
            spinIconLoopRef.current?.stop();
        }
    }, [visible]);

    useEffect(() => {
        pulseLoopRef.current?.stop();
        if (canSpin && !spinning) {
            pulseLoopRef.current = Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, {toValue: 1.14, duration: 650, useNativeDriver: true}),
                Animated.timing(pulseAnim, {toValue: 1,    duration: 650, useNativeDriver: true}),
            ]));
            pulseLoopRef.current.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => { pulseLoopRef.current?.stop(); };
    }, [canSpin, spinning]);

    // Rotate spinning icon
    useEffect(() => {
        spinIconLoopRef.current?.stop();
        if (spinning) {
            spinningIcon.setValue(0);
            spinIconLoopRef.current = Animated.loop(
                Animated.timing(spinningIcon, {toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true})
            );
            spinIconLoopRef.current.start();
        } else {
            spinningIcon.setValue(0);
        }
    }, [spinning]);

    function burstConfetti() {
        confettiAnims.forEach(a => { a.dist.setValue(0); a.opacity.setValue(0); a.scale.setValue(0); });
        Animated.parallel(confettiAnims.map(a => Animated.parallel([
            Animated.timing(a.dist,    {toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
            Animated.sequence([
                Animated.timing(a.opacity, {toValue: 1, duration: 150, useNativeDriver: true}),
                Animated.timing(a.opacity, {toValue: 0, duration: 550, delay: 150, useNativeDriver: true}),
            ]),
            Animated.spring(a.scale, {toValue: 1, friction: 4, tension: 80, useNativeDriver: true}),
        ]))).start();
    }

    async function checkCanSpin() {
        const raw = await storage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        if (!raw) { setCanSpin(true); return; }
        const last = new Date(raw), now = new Date();
        const same = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
        if (same) {
            setCanSpin(false);
            const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            setTimeLeft(`${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`);
        } else {
            setCanSpin(true);
        }
    }

    async function spin() {
        if (spinning || !canSpin || slices.length === 0) return;
        setSpinning(true);
        setResult(null);

        // The server picks the winning slice, enforces the daily limit and
        // applies the reward — the wheel just animates to whatever it returns.
        let serverResult;
        try {
            serverResult = await userService.spinLuckyWheel();
        } catch {
            // Already spun today (429) or offline — reflect that in the UI.
            setSpinning(false);
            setCanSpin(false);
            checkCanSpin();
            return;
        }

        const winnerIdx   = serverResult.index;
        const jitter      = (Math.random() - 0.5) * (segmentAngle * 0.4);
        const toTop       = 360 - winnerIdx * segmentAngle + jitter;
        const total       = spinValue.current + NUM_SPINS * 360 + toTop;
        spinValue.current = total;

        Animated.timing(spinAnim, {
            toValue: total, duration: 4400,
            easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start(async () => {
            setSpinning(false);
            setResult(slices[winnerIdx] ?? null);
            setCanSpin(false);
            burstConfetti();
            Animated.parallel([
                Animated.spring(resultScale,   {toValue: 1, friction: 3.5, tension: 90, useNativeDriver: true}),
                Animated.timing(resultOpacity, {toValue: 1, duration: 250, useNativeDriver: true}),
            ]).start();
            // Server already applied the prize — just mirror it into the stores.
            patchStats({
                coins:       serverResult.stats.coins,
                bombCount:   serverResult.stats.bombCount,
                slowCount:   serverResult.stats.slowCount,
                shieldCount: serverResult.stats.shieldCount,
            });
            await storage.setItem(STORAGE_KEYS.LUCKY_SPIN_DATE, new Date().toISOString());
            onSpinComplete?.();
        });
    }

    const rotate = spinAnim.interpolate({inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend'});
    const spinIconRotate = spinningIcon.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const shineTranslate = shineAnim.interpolate({inputRange: [-1, 2], outputRange: [-350, 350]});

    const rewardLabel = result
        ? result.type === 'coins' ? t('coinsWon', {count: result.value})
            : result.type === 'bomb' ? t('bombWon') : result.type === 'shield' ? t('shieldWon') : t('slowMoWon')
        : '';

    const wheelReady = segments !== null && slices.length > 0;
    const isActive = canSpin && !spinning && wheelReady;
    const glowColor = result ? RESULT_GLOW[result.type] ?? '#FFD700' : '#FFD700';

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.backdrop, {opacity: modalOpacity}]}>

                {/* Sparkles */}
                {sparkleAnims.map((anim, i) => (
                    <Animated.View key={i} pointerEvents="none" style={[styles.sparkleDot, {
                        left: SPARKLES[i].x, top: SPARKLES[i].y,
                        width: SPARKLES[i].size, height: SPARKLES[i].size,
                        borderRadius: SPARKLES[i].size / 2, opacity: anim,
                    }]}/>
                ))}

                <Animated.View style={[styles.cardWrapper, {transform: [{scale: modalScale}]}]}>
                    <LinearGradient
                        colors={['#1e0040', '#0a0018', '#1a0038']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                        style={styles.card}
                    >
                        {/* Glossy shine sweep across the card. */}
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.shine, {transform: [{translateX: shineTranslate}, {skewX: '-18deg'}]}]}
                        >
                            <LinearGradient
                                colors={['rgba(255,215,0,0)', 'rgba(255,225,120,0.30)', 'rgba(255,215,0,0)']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={{flex: 1}}
                            />
                        </Animated.View>

                        {/* Header */}
                        <Text allowFontScaling={false} style={styles.title}>🎡  {t('luckyWheel')}</Text>
                        {isActive && <Text allowFontScaling={false} style={styles.subtitle}>{t('dailyFreeSpin')}</Text>}
                        {!canSpin && !spinning && wheelReady && <Text allowFontScaling={false} style={styles.subtitleDisabled}>⏰  {t('nextSpinIn', {time: timeLeft})}</Text>}
                        {segments === null && <Text allowFontScaling={false} style={styles.subtitleDisabled}>{t('loading')}</Text>}
                        {segments !== null && slices.length === 0 && (
                            <Text allowFontScaling={false} style={styles.subtitleDisabled}>
                                {loadError ? t('wheelLoadError') : t('wheelUnavailable')}
                            </Text>
                        )}

                        <View style={styles.divider}/>

                        {/* Pointer */}
                        <Animated.View style={[styles.pointerWrapper, {transform: [{translateY: pointerBob}]}]}>
                            <LinearGradient colors={['#FFF6C2', '#FFE566', '#cc8800']} style={styles.pointerGem}/>
                            <View style={styles.pointerArrow}/>
                        </Animated.View>

                        {/* Wheel */}
                        <View style={{width: WHEEL_SIZE, height: WHEEL_SIZE, marginVertical: 6}}>
                            {/* Soft golden halo glowing behind the wheel. */}
                            <View pointerEvents="none" style={styles.wheelHalo}/>
                            <Animated.View style={{
                                position: 'absolute', width: WHEEL_SIZE, height: WHEEL_SIZE,
                                borderRadius: CENTER, transform: [{rotate}],
                            }}>
                                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                    {slices.length > 0 ? (
                                        <>
                                            {slices.map((seg, i) => <Path key={`s-${i}`} d={slicePath(i, segmentAngle)} fill={seg.fill}/>)}
                                            {slices.map((_, i) => {
                                                const pt = polarToCart(CENTER, CENTER, RADIUS, i * segmentAngle);
                                                return <Line key={`l-${i}`} x1={CENTER} y1={CENTER} x2={pt.x} y2={pt.y} stroke="rgba(255,215,0,0.22)" strokeWidth={1.5}/>;
                                            })}
                                        </>
                                    ) : (
                                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#2a1a4a"/>
                                    )}
                                    {/* Beveled metallic rim: dark base, gold band, bright highlight. */}
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#5c3a00" strokeWidth={8}/>
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#FFD700" strokeWidth={4}/>
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS - 3} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1}/>
                                    <Circle cx={CENTER} cy={CENTER} r={RADIUS - 8} fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth={1}/>
                                    {slices.length > 0 && ringDots.map((dot, i) => (
                                        <Circle key={`rd-${i}`} cx={dot.x} cy={dot.y} r={3} fill={slices[dot.seg]?.textColor ?? '#FFD700'} opacity={0.85}/>
                                    ))}
                                    {slices.map((seg, i) => {
                                        const ip = sliceTextPos(i, RADIUS * 0.62, segmentAngle);
                                        const lp = sliceTextPos(i, RADIUS * 0.35, segmentAngle);
                                        return (
                                            <G key={`t-${i}`}>
                                                <SvgText x={ip.x} y={ip.y + 7} textAnchor="middle" fontSize={24} fill={seg.textColor}>{seg.icon}</SvgText>
                                                <SvgText x={lp.x} y={lp.y + 5} textAnchor="middle" fontSize={11} fontWeight="bold" fill={seg.textColor} fillOpacity={0.9}>{seg.label}</SvgText>
                                            </G>
                                        );
                                    })}
                                    <Circle cx={CENTER} cy={CENTER} r={42} fill="#1a0035"/>
                                    <Circle cx={CENTER} cy={CENTER} r={42} fill="none" stroke="#FFD700" strokeWidth={2.5} strokeOpacity={0.6}/>
                                </Svg>
                            </Animated.View>

                            {/* Spin button */}
                            <View style={[styles.spinButtonFixed, {left: CENTER - 38, top: CENTER - 38}]}>
                                <Animated.View style={{transform: [{scale: isActive ? pulseAnim : 1}]}}>
                                    <TouchableOpacity
                                        onPress={spin}
                                        disabled={spinning || !canSpin || !wheelReady}
                                        activeOpacity={0.82}
                                        accessible={true}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('luckyWheel')}
                                        accessibilityState={{disabled: spinning || !canSpin || !wheelReady}}
                                    >
                                        <LinearGradient
                                            colors={isActive ? ['#FFE566', '#FFD700', '#cc8800'] : ['#333', '#222', '#111']}
                                            style={[styles.spinGradient, isActive ? styles.spinGradientActive : styles.spinGradientInactive]}
                                        >
                                            {spinning ? (
                                                <Animated.Text allowFontScaling={false} style={[styles.spinText, styles.spinTextSpinning, {transform: [{rotate: spinIconRotate}]}]}>
                                                    ⟳
                                                </Animated.Text>
                                            ) : (
                                                <Text allowFontScaling={false} style={[styles.spinText, isActive ? styles.spinTextActive : styles.spinTextInactive]}>
                                                    {canSpin ? t('spin') : '✓'}
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>

                            {/* Confetti burst */}
                            {confettiAnims.map((a, i) => {
                                const rad = (CONFETTI[i].angle * Math.PI) / 180;
                                const tx = a.dist.interpolate({inputRange: [0, 1], outputRange: [0, Math.cos(rad) * CONFETTI[i].dist]});
                                const ty = a.dist.interpolate({inputRange: [0, 1], outputRange: [0, Math.sin(rad) * CONFETTI[i].dist]});
                                return (
                                    <Animated.View key={`cf-${i}`} pointerEvents="none" style={{
                                        position: 'absolute',
                                        left: CENTER - CONFETTI[i].size / 2,
                                        top:  CENTER - CONFETTI[i].size / 2,
                                        width: CONFETTI[i].size, height: CONFETTI[i].size,
                                        borderRadius: CONFETTI[i].size / 2,
                                        backgroundColor: CONFETTI[i].color,
                                        opacity: a.opacity,
                                        transform: [{translateX: tx}, {translateY: ty}, {scale: a.scale}],
                                    }}/>
                                );
                            })}
                        </View>

                        {/* Result banner */}
                        {result && (
                            <Animated.View style={[styles.resultWrapper, {
                                opacity: resultOpacity,
                                transform: [{scale: resultScale}],
                                shadowColor: glowColor,
                            }]}>
                                <LinearGradient
                                    colors={RESULT_COLORS[result.type] ?? RESULT_COLORS.coins}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                    style={[styles.resultGradient, {borderColor: glowColor}]}
                                >
                                    <Text allowFontScaling={false} style={styles.resultYouWon}>✨  {t('youWon')}  ✨</Text>
                                    <Text allowFontScaling={false} style={styles.resultIcon}>{result.icon}</Text>
                                    <Text allowFontScaling={false} style={[styles.resultLabel, {color: glowColor, textShadowColor: glowColor}]}>
                                        {rewardLabel}
                                    </Text>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {/* Cooldown box */}
                        {!canSpin && !spinning && !result && (
                            <View style={styles.cooldownBox}>
                                <Text allowFontScaling={false} style={styles.cooldownIcon}>⏳</Text>
                                <Text allowFontScaling={false} style={styles.cooldownText}>{t('comeBackForSpin', {time: timeLeft})}</Text>
                            </View>
                        )}

                        {/* Close */}
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.8}
                            style={styles.closeButton}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t('close')}
                        >
                            <LinearGradient
                                colors={['rgba(255,215,0,0.18)', 'rgba(255,215,0,0.06)']}
                                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                                style={styles.closeGradient}
                            >
                                <Text allowFontScaling={false} style={styles.closeText}>{t('close')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
