import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Modal, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {storage} from '../../../db/kvStore.ts';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, G, Line, Path, Text as SvgText} from 'react-native-svg';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import {playSfx} from '../../../utils/sfx.ts';
import {haptic} from '../../../utils/haptics.ts';
import {useAuthStore} from '../../../store/authStore.ts';
import * as userService from '../../../services/userService.ts';
import {ApiError} from '../../../services/api.ts';
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
// A denser burst than a plain ring of dots: every piece leaves the hub at its own
// angle and distance, half of them are ribbons rather than dots, they tumble as
// they fly and are pulled down by `fall` so the burst reads as a real pop.
const CONFETTI = Array.from({length: 30}, (_, i) => ({
    id:     i,
    angle:  (i / 30) * 360 + (i % 3) * 7,
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:   4 + (i % 4) * 2,
    long:   i % 2 === 0,                 // ribbon vs dot
    dist:   95 + (i % 5) * 32,
    fall:   40 + (i % 4) * 35,           // gravity pull by the end of the flight
    spin:   (i % 2 ? 1 : -1) * (360 + (i % 3) * 240),
    delay:  (i % 6) * 35,
}));

// Expanding shock rings that wash out of the hub the instant the prize lands.
const RINGS = [0, 1, 2];

const SPARKLES = Array.from({length: 10}, (_, i) => ({
    id: i, x: 10 + Math.random() * 340, y: 10 + Math.random() * 580,
    size: Math.random() * 3 + 1.5, dur: 1200 + Math.random() * 2000, delay: Math.random() * 2000,
}));

// Normalises any angle into [0, 360).
function mod360(deg: number) {
    return ((deg % 360) + 360) % 360;
}
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

// "4h 12m" — the countdown next to the locked wheel. Seconds come from the
// server, so this stays right even if the device clock or timezone doesn't
// agree with it.
function formatTimeLeft(seconds: number) {
    const s = Math.max(0, seconds);
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    /** Fired after a successful spin, with the server's seconds-until-reset. */
    onSpinComplete?: (nextSpinInSeconds: number) => void;
    /** Fired when the server refuses the spin as already used today (429). */
    onSpinRejected?: () => void;
    /**
     * Wheel layout, fetched by Home on focus rather than here on open — by the
     * time the player taps the button it's already in hand, so the wheel draws
     * its prizes immediately instead of showing "loading" on a dead grey disc.
     * `null` means still in flight, `[]` means the request finished with nothing
     * usable (see `loadError` for which of the two messages to show).
     */
    segments: LuckyWheelSegment[] | null;
    /**
     * Whether today's free spin is still available, as decided by the server
     * (Home fetches it with the layout). This used to be worked out here from a
     * date in device storage, which drifts from the server's own
     * `last_lucky_spin_at` — see LuckyWheelState in services/types.
     */
    canSpin: boolean;
    /** Seconds until the spin resets; only meaningful while `canSpin` is false. */
    nextSpinInSeconds: number;
    loadError?: boolean;
}

export default function LuckyWheelModal({
    visible,
    onClose,
    onSpinComplete,
    onSpinRejected,
    segments,
    canSpin: canSpinProp,
    nextSpinInSeconds,
    loadError = false,
}: Props) {
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
    // Win-moment animations.
    const winFlash        = useRef(new Animated.Value(0)).current;   // gold wash over the card
    const wheelPop        = useRef(new Animated.Value(1)).current;   // wheel recoil on the hit
    const ringAnims       = useRef(RINGS.map(() => new Animated.Value(0))).current;
    const winnerPulse     = useRef(new Animated.Value(0)).current;   // winning slice highlight
    const resultBob       = useRef(new Animated.Value(0)).current;   // prize card breathing
    const winnerLoopRef   = useRef<Animated.CompositeAnimation | null>(null);
    const resultLoopRef   = useRef<Animated.CompositeAnimation | null>(null);

    const pulseLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
    const pointerLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
    const shineLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
    const sparkleLoopRefs = useRef<Animated.CompositeAnimation[]>([]);
    const spinIconLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const [spinning, setSpinning] = useState(false);
    const [result,   setResult]   = useState<WheelSlice | null>(null);
    // Array position of the winning slice — drives the highlight drawn on top of
    // the wheel, which rotates with it and so stays under the pointer.
    const [winnerPos, setWinnerPos] = useState<number | null>(null);
    // Mirrors the server's verdict, but can also be flipped locally the moment a
    // spin lands (or comes back 429) so the hub locks without waiting for the
    // next fetch. Re-synced from the prop whenever Home learns something newer.
    const [canSpin,  setCanSpin]  = useState(canSpinProp);
    const [timeLeft, setTimeLeft] = useState(formatTimeLeft(nextSpinInSeconds));
    useEffect(() => { setCanSpin(canSpinProp); }, [canSpinProp]);
    useEffect(() => { setTimeLeft(formatTimeLeft(nextSpinInSeconds)); }, [nextSpinInSeconds]);
    // The card is held back one frame after the modal opens. Everything in the
    // first commit — the ~70-node SVG wheel above all — has to be built before
    // the native dialog is up and the fade-in below can even start, which is
    // dead time between the player's tap and anything happening. The backdrop
    // goes up on its own first; the card mounts on the next frame, still inside
    // its own fade from opacity 0, so nothing is visibly missing.
    const [contentReady, setContentReady] = useState(false);
    useEffect(() => {
        if (!visible) {
            setContentReady(false);
            return;
        }
        const raf = requestAnimationFrame(() => setContentReady(true));
        return () => cancelAnimationFrame(raf);
    }, [visible]);
    const slices       = useMemo(() => buildSlices(segments ?? []), [segments]);
    const segmentAngle = slices.length > 0 ? 360 / slices.length : 360;
    const ringDots     = useMemo(() => buildRingDots(slices), [slices]);

    useEffect(() => {
        if (visible) {
            // A light tick the moment the wheel opens — a menu-open feel, distinct
            // from the heavy 'go' on spin and the 'claim' payoff on a win.
            haptic('equip');
            setResult(null);
            setWinnerPos(null);
            resultScale.setValue(0);
            resultOpacity.setValue(0);
            winFlash.setValue(0);
            winnerLoopRef.current?.stop();
            resultLoopRef.current?.stop();

            Animated.parallel([
                Animated.spring(modalScale,   {toValue: 1, friction: 6, tension: 65, useNativeDriver: true}),
                Animated.timing(modalOpacity, {toValue: 1, duration: 220, useNativeDriver: true}),
            ]).start();

            // Shine sweep. Held in a ref like every other loop in this file —
            // it was the one that wasn't, so the else-branch below stopped all
            // the others and left this one running on every modal open.
            shineLoopRef.current?.stop();
            shineAnim.setValue(-1);
            shineLoopRef.current = Animated.loop(
                Animated.timing(shineAnim, {toValue: 2, duration: 2800, delay: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true})
            );
            shineLoopRef.current.start();

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
            shineLoopRef.current?.stop();
            spinIconLoopRef.current?.stop();
            winnerLoopRef.current?.stop();
            resultLoopRef.current?.stop();
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

    // The whole win moment, fired the instant the wheel stops: a gold wash over
    // the card, the wheel recoiling off the pointer, shock rings washing out of
    // the hub, the winning slice lighting up under the pointer, and a tumbling
    // confetti burst — then the prize card springs in and keeps breathing.
    function celebrateWin() {
        // 0. The payoff: the game's biggest positive sound + haptic, fired the
        // instant the wheel lands on a prize. 'claim' is reserved for exactly
        // this kind of once-in-a-while reward (see utils/sfx.ts, utils/haptics.ts).
        playSfx('claim');
        haptic('claim');

        // 1. Gold flash across the card.
        winFlash.setValue(0);
        Animated.sequence([
            Animated.timing(winFlash, {toValue: 1, duration: 90,  useNativeDriver: true}),
            Animated.timing(winFlash, {toValue: 0, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true}),
        ]).start();

        // 2. The wheel takes the hit and springs back.
        wheelPop.setValue(1);
        Animated.sequence([
            Animated.timing(wheelPop, {toValue: 1.06, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true}),
            Animated.spring(wheelPop, {toValue: 1, friction: 3.5, tension: 90, useNativeDriver: true}),
        ]).start();

        // 3. Shock rings, staggered.
        ringAnims.forEach((r, i) => {
            r.setValue(0);
            Animated.timing(r, {
                toValue: 1, duration: 900, delay: i * 170,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }).start();
        });

        // 4. The winning slice keeps glowing under the pointer.
        winnerLoopRef.current?.stop();
        winnerPulse.setValue(0);
        winnerLoopRef.current = Animated.loop(Animated.sequence([
            Animated.timing(winnerPulse, {toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            Animated.timing(winnerPulse, {toValue: 0.35, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        ]));
        winnerLoopRef.current.start();

        // 5. Confetti: fly out, tumble, fall, fade.
        confettiAnims.forEach(a => { a.dist.setValue(0); a.opacity.setValue(0); a.scale.setValue(0); });
        Animated.parallel(confettiAnims.map((a, i) => Animated.parallel([
            Animated.timing(a.dist, {
                toValue: 1, duration: 1100, delay: CONFETTI[i].delay,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(a.opacity, {toValue: 1, duration: 120, delay: CONFETTI[i].delay, useNativeDriver: true}),
                Animated.timing(a.opacity, {toValue: 0, duration: 620, delay: 320, useNativeDriver: true}),
            ]),
            Animated.spring(a.scale, {toValue: 1, friction: 4, tension: 80, delay: CONFETTI[i].delay, useNativeDriver: true}),
        ]))).start();

        // 6. The prize card springs in, then breathes.
        resultLoopRef.current?.stop();
        resultBob.setValue(0);
        Animated.parallel([
            Animated.spring(resultScale,   {toValue: 1, friction: 3.5, tension: 90, useNativeDriver: true}),
            Animated.timing(resultOpacity, {toValue: 1, duration: 250, useNativeDriver: true}),
        ]).start(() => {
            resultLoopRef.current = Animated.loop(Animated.sequence([
                Animated.timing(resultBob, {toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                Animated.timing(resultBob, {toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            ]));
            resultLoopRef.current.start();
        });
    }

    // What's left of the 24h cooldown according to this device's own record of
    // the last spin. Only a stop-gap for the bare 429 below — the server's exact
    // figure lands a moment later via Home's re-fetch. Falls back to the full
    // window when the device has no record (fresh install).
    async function localSecondsLeft() {
        const raw  = await storage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        const last = raw ? new Date(raw).getTime() : NaN;
        if (!Number.isFinite(last)) return userService.SPIN_COOLDOWN_SECONDS;
        return Math.max(
            0,
            Math.round(userService.SPIN_COOLDOWN_SECONDS - (Date.now() - last) / 1000),
        );
    }

    async function spin() {
        if (spinning || !canSpin || slices.length === 0) return;
        setSpinning(true);

        // Kick-off feedback: a launch blip + buzz the moment the wheel starts
        // turning, so pressing Spin lands with the same weight as the rest of
        // the game. The reward's own sound/haptic fires later in celebrateWin().
        playSfx('go');
        haptic('go');

        setResult(null);
        setWinnerPos(null);
        winnerLoopRef.current?.stop();
        resultLoopRef.current?.stop();

        // The server picks the winning slice, enforces the daily limit and
        // applies the reward — the wheel just animates to whatever it returns.
        let serverResult;
        try {
            serverResult = await userService.spinLuckyWheel();
        } catch (e) {
            setSpinning(false);
            // 429 is the one refusal that means "today's spin is gone" — lock
            // the hub and start the countdown. Anything else (offline, timeout,
            // a 5xx) took no spin away, so leave the button live to retry
            // instead of locking the player out of a spin they still have.
            if ((e as ApiError)?.status === 429) {
                setCanSpin(false);
                setTimeLeft(formatTimeLeft(await localSecondsLeft()));
                onSpinRejected?.();
            }
            return;
        }

        // Where the winning slice has to end up. Slice i covers
        // [i·segmentAngle, (i+1)·segmentAngle) clockwise from 12 o'clock, and the
        // pointer sits at 12 o'clock — so the wheel must turn until the slice's
        // MIDDLE (not its leading edge) is under the pointer. The jitter only
        // wanders inside the slice: capped at 35% of the half-slice, it can never
        // push the landing point across a boundary into the neighbouring prize.
        // The slices are drawn in array order, so the geometry needs the winner's
        // POSITION in that array. The server sends the segment's own `index`
        // field, which only coincides with the position when the segments happen
        // to arrive ordered 0..n-1 — match on the field and fall back to the
        // raw index if it isn't found.
        const found      = slices.findIndex(s => s.index === serverResult.index);
        const winnerIdx  = found >= 0 ? found : serverResult.index;
        const sliceMid   = winnerIdx * segmentAngle + segmentAngle / 2;
        const jitter     = (Math.random() - 0.5) * segmentAngle * 0.35;
        const targetMod  = mod360(360 - sliceMid + jitter);

        // The animated value keeps accumulating across spins, so the wheel is
        // currently resting at spinValue.current mod 360 — not at 0. Turn by the
        // delta from there, otherwise every spin after the first lands off by the
        // previous spin's leftover angle (the "stops on the wrong prize" bug).
        const currentMod = mod360(spinValue.current);
        const delta      = mod360(targetMod - currentMod);
        const total      = spinValue.current + NUM_SPINS * 360 + delta;
        spinValue.current = total;

        Animated.timing(spinAnim, {
            toValue: total, duration: 4400,
            easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start(async () => {
            setSpinning(false);
            setResult(slices[winnerIdx] ?? null);
            setWinnerPos(winnerIdx);
            setCanSpin(false);
            setTimeLeft(formatTimeLeft(serverResult.nextSpinInSeconds));
            celebrateWin();
            // Server already applied the prize — just mirror it into the stores.
            patchStats({
                coins:       serverResult.stats.coins,
                bombCount:   serverResult.stats.bombCount,
                slowCount:   serverResult.stats.slowCount,
                shieldCount: serverResult.stats.shieldCount,
            });
            // Kept purely as the offline fallback Home reads when it can't reach
            // the server for the real verdict — the gate itself is server-side.
            await storage.setItem(STORAGE_KEYS.LUCKY_SPIN_DATE, new Date().toISOString());
            onSpinComplete?.(serverResult.nextSpinInSeconds);
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

                {contentReady && <Animated.View style={[styles.cardWrapper, {transform: [{scale: modalScale}]}]}>
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

                        {/* Win flash — a gold wash over the whole card on the hit. */}
                        <Animated.View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                left: 0, right: 0, top: 0, bottom: 0,
                                backgroundColor: glowColor,
                                borderRadius: 32,
                                opacity: winFlash.interpolate({inputRange: [0, 1], outputRange: [0, 0.5]}),
                                zIndex: 20,
                            }}
                        />

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
                                borderRadius: CENTER, transform: [{rotate}, {scale: wheelPop}],
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

                                {/* Winning slice lit up. It lives inside the rotating
                                    layer, so it stays locked to its slice under the
                                    pointer while it pulses. */}
                                {winnerPos !== null && (
                                    <Animated.View
                                        pointerEvents="none"
                                        style={{position: 'absolute', opacity: winnerPulse}}
                                    >
                                        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                            <Path
                                                d={slicePath(winnerPos, segmentAngle)}
                                                fill="rgba(255,255,255,0.30)"
                                                stroke="#FFF6C2"
                                                strokeWidth={3}
                                            />
                                        </Svg>
                                    </Animated.View>
                                )}
                            </Animated.View>

                            {/* Shock rings washing out of the hub on the win. */}
                            {result && ringAnims.map((r, i) => (
                                <Animated.View
                                    key={`ring-${i}`}
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        left: 0, top: 0,
                                        width: WHEEL_SIZE, height: WHEEL_SIZE,
                                        borderRadius: CENTER,
                                        borderWidth: 3,
                                        borderColor: glowColor,
                                        opacity: r.interpolate({inputRange: [0, 1], outputRange: [0.7, 0]}),
                                        transform: [{scale: r.interpolate({inputRange: [0, 1], outputRange: [0.28, 1.45]})}],
                                    }}
                                />
                            ))}

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

                            {/* Confetti burst — pieces fly out, tumble and drop.
                                Gated on `result` like the shock rings above: 30
                                Animated.Views with four interpolated transforms
                                each is the single heaviest thing in this modal,
                                and it was being built every time the wheel
                                opened for a burst that only plays after a win. */}
                            {result && confettiAnims.map((a, i) => {
                                const c   = CONFETTI[i];
                                const rad = (c.angle * Math.PI) / 180;
                                const tx  = a.dist.interpolate({inputRange: [0, 1], outputRange: [0, Math.cos(rad) * c.dist]});
                                // Gravity: the vertical travel ends `fall` px lower than
                                // a straight radial flight would.
                                const ty  = a.dist.interpolate({
                                    inputRange:  [0, 0.6, 1],
                                    outputRange: [0, Math.sin(rad) * c.dist * 0.75, Math.sin(rad) * c.dist + c.fall],
                                });
                                const rot = a.dist.interpolate({inputRange: [0, 1], outputRange: ['0deg', `${c.spin}deg`]});
                                return (
                                    <Animated.View key={`cf-${i}`} pointerEvents="none" style={{
                                        position: 'absolute',
                                        left: CENTER - c.size / 2,
                                        top:  CENTER - c.size / 2,
                                        width:  c.size,
                                        height: c.long ? c.size * 2.6 : c.size,
                                        borderRadius: c.long ? 2 : c.size / 2,
                                        backgroundColor: c.color,
                                        opacity: a.opacity,
                                        transform: [{translateX: tx}, {translateY: ty}, {rotate: rot}, {scale: a.scale}],
                                    }}/>
                                );
                            })}
                        </View>

                        {/* Result banner */}
                        {result && (
                            <Animated.View style={[styles.resultWrapper, {
                                opacity: resultOpacity,
                                transform: [
                                    {scale: Animated.multiply(
                                        resultScale,
                                        resultBob.interpolate({inputRange: [0, 1], outputRange: [1, 1.04]}),
                                    )},
                                    {translateY: resultBob.interpolate({inputRange: [0, 1], outputRange: [0, -4]})},
                                ],
                                shadowColor: glowColor,
                                borderColor: glowColor,
                            }]}>
                                <LinearGradient
                                    pointerEvents="none"
                                    colors={RESULT_COLORS[result.type] ?? RESULT_COLORS.coins}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                    style={styles.resultGradient}
                                />
                                <Text allowFontScaling={false} style={styles.resultYouWon}>✨  {t('youWon')}  ✨</Text>
                                <Text allowFontScaling={false} style={styles.resultIcon}>{result.icon}</Text>
                                <Text allowFontScaling={false} style={[styles.resultLabel, {color: glowColor, textShadowColor: glowColor}]}>
                                    {rewardLabel}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Cooldown box */}
                        {!canSpin && !spinning && !result && (
                            <View style={styles.cooldownBox}>
                                <Text allowFontScaling={false} style={styles.cooldownIcon}>⏳</Text>
                                <Text allowFontScaling={false} style={styles.cooldownText}>{t('comeBackForSpin', {time: timeLeft})}</Text>
                            </View>
                        )}

                        {/* Close — fires on release, not on press-in. Dismissing
                            on touch-down tears the native Modal down while the
                            gesture is still open, so the touch never gets its
                            "up": the responder is left dangling and the next tap
                            outside is swallowed clearing it. That's what made
                            the wheel open only on every second press of the Home
                            button. Anything that unmounts its own modal has to
                            wait for the release. */}
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
                </Animated.View>}
            </Animated.View>
        </Modal>
    );
}
