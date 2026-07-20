import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Easing, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SvgXml} from 'react-native-svg';
import {Boss} from '../../../services/types.ts';

const {width, height} = Dimensions.get('window');
export const BOSS_SIZE = 150;
// Inner width of the HP track: the bar container is BOSS_SIZE + 30 wide and the
// track draws a 1px border on each side. Known up front, so the fill can slide
// on a transform instead of being measured.
const HP_BAR_W = BOSS_SIZE + 30 - 2;

// ── Boss tiers ──────────────────────────────────────────────────────────────
// One entry per 10 levels. `name` shows on the banner/health bar, `aura` is the
// outer ring tint, `glow` the soft halo, `colors` the body gradient.
export interface BossTier {
    emoji:  string;
    name:   string;
    colors: string[];
    glow:   string;
    aura:   string;
}

const BOSS_TIERS: BossTier[] = [
    {emoji: '👾', name: 'GLITCH KING', colors: ['#5b00a6', '#b3003c', '#3d0066'], glow: 'rgba(220,0,90,0.55)',  aura: '#ff2d6b'}, // lv 10
    {emoji: '💀', name: 'BONE REAPER', colors: ['#2a2a2a', '#6d0000', '#1a1a1a'], glow: 'rgba(220,0,0,0.6)',    aura: '#ff3b3b'}, // lv 20
    {emoji: '🔮', name: 'VOID ORACLE', colors: ['#001a55', '#0047cc', '#000d33'], glow: 'rgba(0,110,255,0.55)', aura: '#3da0ff'}, // lv 30
    {emoji: '👹', name: 'EMBER ONI',   colors: ['#3b0000', '#c23800', '#2b0000'], glow: 'rgba(255,90,0,0.6)',   aura: '#ff7a1a'}, // lv 40
    {emoji: '🐉', name: 'ELDER WYRM',  colors: ['#002b00', '#009a2e', '#001a00'], glow: 'rgba(0,220,70,0.55)',  aura: '#39e66b'}, // lv 50+
];

export function getBossTier(level: number): BossTier {
    const idx = Math.min(Math.floor(level / 10) - 1, BOSS_TIERS.length - 1);
    return BOSS_TIERS[Math.max(0, idx)];
}

interface Props {
    bossHP:    number;
    bossMaxHP: number;
    level:     number;
    onTap:     () => void;
    // Admin-managed boss for this level (from the backend). When present its
    // name, colours, glow and SVG/emoji art override the local tier so the
    // fight shows exactly what the admin configured; null falls back to the
    // bundled BOSS_TIERS look.
    boss?:     Boss | null;
}

// ── Floating "-1" damage number ───────────────────────────────────────────────
function DamageFloat({onDone}: {onDone: () => void}) {
    const ty = useRef(new Animated.Value(0)).current;
    const op = useRef(new Animated.Value(1)).current;
    const sc = useRef(new Animated.Value(0.6)).current;
    const driftX = useRef((Math.random() - 0.5) * 70).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(ty, {toValue: -80, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true}),
            Animated.spring(sc, {toValue: 1.1, friction: 4, useNativeDriver: true}),
            Animated.sequence([
                Animated.delay(280),
                Animated.timing(op, {toValue: 0, duration: 470, useNativeDriver: true}),
            ]),
        ]).start(onDone);
    }, []);

    return (
        <Animated.Text
            allowFontScaling={false}
            pointerEvents="none"
            style={{
                position:         'absolute',
                top:              BOSS_SIZE / 2 - 16,
                color:            '#fff',
                fontSize:         28,
                fontWeight:       '900',
                textShadowColor:  '#ff1744',
                textShadowRadius: 10,
                opacity:          op,
                transform:        [{translateX: driftX}, {translateY: ty}, {scale: sc}],
            }}
        >
            -1
        </Animated.Text>
    );
}

function BossBox({bossHP, bossMaxHP, level, onTap, boss}: Props) {
    const posX        = useRef(new Animated.Value(width / 2 - BOSS_SIZE / 2)).current;
    const posY        = useRef(new Animated.Value(height / 2 - BOSS_SIZE / 2)).current;
    const scaleAnim   = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.3)).current;
    const hitOpacity  = useRef(new Animated.Value(0)).current;
    const bobAnim     = useRef(new Animated.Value(0)).current;
    const spinAnim    = useRef(new Animated.Value(0)).current;
    const wobbleAnim  = useRef(new Animated.Value(0)).current;
    const ringScale   = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;
    const hpAnim      = useRef(new Animated.Value(1)).current;
    const moveRef     = useRef<Animated.CompositeAnimation | null>(null);

    // Floating damage numbers (one per tap, self-removing after their animation).
    const [floats, setFloats] = useState<number[]>([]);
    const floatIdRef = useRef(0);

    const hpRatio   = bossMaxHP > 0 ? bossHP / bossMaxHP : 0;
    const isEnraged = hpRatio > 0 && hpRatio <= 0.33;
    const hpColor   = hpRatio > 0.6 ? '#2ecc71' : hpRatio > 0.33 ? '#f39c12' : '#e74c3c';
    const hpColorHi = hpRatio > 0.6 ? '#7bed9f' : hpRatio > 0.33 ? '#ffce6b' : '#ff7675';
    const moveDur   = Math.max(480, 1500 - Math.floor((level - 1) / 10) * 150);
    const tier      = getBossTier(level);

    // Visuals: prefer the admin boss, fall back to the bundled tier. The aura
    // ring has no admin field, so it always uses the tier accent.
    const bossName    = boss?.name?.trim() ? boss.name.toUpperCase() : tier.name;
    const bodyColors  = boss ? [boss.colorStart, boss.colorMid, boss.colorEnd] : tier.colors;
    const haloColor   = boss?.glow || tier.glow;
    const labelEmoji  = boss?.emoji || tier.emoji;          // shown on the HP banner
    const iconSvg     = boss?.iconSvg || null;              // wins over the emoji on the body

    // Entry pop + perpetual halo pulse, idle breathing, and slow aura spin.
    useEffect(() => {
        Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 55, useNativeDriver: true}).start(() => {
            moveToNext();
        });

        // Collected and stopped alongside moveRef. The cleanup below already
        // existed but only stopped the movement, so every boss fight left these
        // three loops driving a component that no longer exists.
        const loops = [
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowOpacity, {toValue: 1,   duration: 650, useNativeDriver: true}),
                    Animated.timing(glowOpacity, {toValue: 0.2, duration: 650, useNativeDriver: true}),
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bobAnim, {toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
                    Animated.timing(bobAnim, {toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
                ])
            ),
            Animated.loop(
                Animated.timing(spinAnim, {toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true})
            ),
        ];
        loops.forEach(l => l.start());

        return () => {
            moveRef.current?.stop();
            loops.forEach(l => l.stop());
        };
    }, []);

    // Smoothly drain the HP bar whenever HP changes.
    useEffect(() => {
        Animated.timing(hpAnim, {toValue: hpRatio, duration: 220, useNativeDriver: true}).start();
    }, [hpRatio]);

    // Low-HP rage: the boss shudders left/right until it dies.
    useEffect(() => {
        if (!isEnraged) {
            wobbleAnim.stopAnimation();
            wobbleAnim.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(wobbleAnim, {toValue:  1, duration: 80, useNativeDriver: true}),
                Animated.timing(wobbleAnim, {toValue: -1, duration: 80, useNativeDriver: true}),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isEnraged]);

    function moveToNext() {
        const nx = 20  + Math.random() * (width  - BOSS_SIZE - 40);
        const ny = 130 + Math.random() * (height * 0.52 - BOSS_SIZE);
        moveRef.current = Animated.parallel([
            Animated.timing(posX, {toValue: nx, duration: moveDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
            Animated.timing(posY, {toValue: ny, duration: moveDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]);
        moveRef.current.start(({finished}: {finished: boolean}) => {
            if (finished) moveToNext();
        });
    }

    function handleTap() {
        // Red hit flash on the body.
        hitOpacity.setValue(0.85);
        Animated.timing(hitOpacity, {toValue: 0, duration: 200, useNativeDriver: true}).start();

        // Squash-and-stretch punch.
        Animated.sequence([
            Animated.timing(scaleAnim, {toValue: 0.82, duration: 65,  useNativeDriver: true}),
            Animated.spring( scaleAnim, {toValue: 1,    friction: 4, tension: 120, useNativeDriver: true}),
        ]).start();

        // Expanding shockwave ring.
        ringScale.setValue(0);
        ringOpacity.setValue(0.9);
        Animated.parallel([
            Animated.timing(ringScale,   {toValue: 1, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true}),
            Animated.timing(ringOpacity, {toValue: 0, duration: 360, useNativeDriver: true}),
        ]).start();

        // Spawn a floating damage number.
        const id = floatIdRef.current++;
        setFloats(prev => [...prev, id]);

        onTap();
    }

    const bobY      = bobAnim.interpolate({inputRange: [0, 1], outputRange: [0, -10]});
    const spin      = spinAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const spinBack  = spinAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-360deg']});
    const wobbleDeg = wobbleAnim.interpolate({inputRange: [-1, 1], outputRange: ['-7deg', '7deg']});
    const ringSize  = BOSS_SIZE + 30;

    return (
        <Animated.View
            style={{
                position:   'absolute',
                zIndex:     12,
                alignItems: 'center',
                transform:  [{translateX: posX}, {translateY: posY}, {scale: scaleAnim}],
            }}
        >
            {/* HP bar */}
            <View style={{width: BOSS_SIZE + 30, marginBottom: 8}}>
                <Text allowFontScaling={false} style={{
                    color:            isEnraged ? '#ff5252' : '#fff',
                    fontSize:         12,
                    fontWeight:       '900',
                    letterSpacing:    1.5,
                    textAlign:        'center',
                    marginBottom:     5,
                    textShadowColor:  '#000',
                    textShadowRadius: 6,
                }}>
                    {labelEmoji} {bossName}
                </Text>
                <View style={{
                    width:           '100%',
                    height:          10,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius:    5,
                    overflow:        'hidden',
                    borderWidth:     1,
                    borderColor:     'rgba(255,255,255,0.3)',
                }}>
                    {/* Revealed by sliding a full-width fill under the track's
                        overflow:hidden, rather than animating its width. A
                        percentage width is a layout prop, so the native driver
                        couldn't touch it and the drain ran on the JS thread —
                        re-firing on every tap of the boss, each time forcing a
                        Yoga layout pass, in the middle of the game loop.

                        translateX rather than scaleX because the fill holds a
                        gradient: scaling would squash it, sliding keeps it at
                        its authored proportions. The track width is a constant
                        here, so no measurement is needed. */}
                    <Animated.View style={{
                        width:        HP_BAR_W,
                        height:       '100%',
                        borderRadius: 5,
                        overflow:     'hidden',
                        transform:    [{
                            translateX: hpAnim.interpolate({
                                inputRange:  [0, 1],
                                outputRange: [-HP_BAR_W, 0],
                            }),
                        }],
                    }}>
                        <LinearGradient
                            colors={[hpColorHi, hpColor]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={{flex: 1}}
                        />
                    </Animated.View>
                </View>
                <Text allowFontScaling={false} style={{
                    color:            'rgba(255,255,255,0.85)',
                    fontSize:         10,
                    fontWeight:       '800',
                    letterSpacing:    1,
                    textAlign:        'center',
                    marginTop:        3,
                    textShadowColor:  '#000',
                    textShadowRadius: 4,
                }}>
                    ☠️ {bossHP} / {bossMaxHP}
                </Text>
            </View>

            {/* Body + auras + effects, breathing & raging together */}
            <Animated.View
                style={{
                    alignItems:     'center',
                    justifyContent: 'center',
                    transform:      [{translateY: bobY}, {rotate: wobbleDeg}],
                }}
            >
                {/* Soft pulsing halo */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position:        'absolute',
                        width:           BOSS_SIZE + 36,
                        height:          BOSS_SIZE + 36,
                        borderRadius:    (BOSS_SIZE + 36) / 2,
                        backgroundColor: isEnraged ? 'rgba(255,30,30,0.55)' : haloColor,
                        opacity:         glowOpacity,
                    }}
                />

                {/* Outer spinning aura ring (dashed feel via two rings) */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position:     'absolute',
                        width:        BOSS_SIZE + 26,
                        height:       BOSS_SIZE + 26,
                        borderRadius: (BOSS_SIZE + 26) / 2,
                        borderWidth:  3,
                        borderColor:  isEnraged ? '#ff1744' : tier.aura,
                        borderStyle:  'dashed',
                        opacity:      0.85,
                        transform:    [{rotate: spin}],
                    }}
                />
                {/* Inner counter-spinning aura ring */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position:     'absolute',
                        width:        BOSS_SIZE + 8,
                        height:       BOSS_SIZE + 8,
                        borderRadius: (BOSS_SIZE + 8) / 2,
                        borderWidth:  2,
                        borderColor:  'rgba(255,255,255,0.4)',
                        borderStyle:  'dotted',
                        transform:    [{rotate: spinBack}],
                    }}
                />

                {/* Tap shockwave */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position:     'absolute',
                        width:        ringSize,
                        height:       ringSize,
                        borderRadius: ringSize / 2,
                        borderWidth:  3,
                        borderColor:  '#fff',
                        opacity:      ringOpacity,
                        transform:    [{scale: ringScale.interpolate({inputRange: [0, 1], outputRange: [0.55, 1.7]})}],
                    }}
                />

                {/* Boss body */}
                <TouchableOpacity
                    onPressIn={handleTap}
                    activeOpacity={0.95}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Attack ${bossName}, ${bossHP} of ${bossMaxHP} health`}
                >
                    <LinearGradient
                        colors={bodyColors}
                        start={{x: 0.2, y: 0}}
                        end={{x: 0.8, y: 1}}
                        style={{
                            width:          BOSS_SIZE,
                            height:         BOSS_SIZE,
                            borderRadius:   BOSS_SIZE / 2,
                            alignItems:     'center',
                            justifyContent: 'center',
                            borderWidth:    3,
                            borderColor:    isEnraged ? 'rgba(255,40,40,0.95)' : 'rgba(255,255,255,0.45)',
                        }}
                    >
                        {/* Glossy top highlight for an orb look */}
                        <View
                            pointerEvents="none"
                            style={{
                                position:        'absolute',
                                top:             BOSS_SIZE * 0.12,
                                width:           BOSS_SIZE * 0.5,
                                height:          BOSS_SIZE * 0.32,
                                borderRadius:    BOSS_SIZE * 0.25,
                                backgroundColor: 'rgba(255,255,255,0.22)',
                            }}
                        />

                        {iconSvg ? (
                            <SvgXml xml={iconSvg} width={BOSS_SIZE * 0.62} height={BOSS_SIZE * 0.62}/>
                        ) : (
                            <Text allowFontScaling={false} style={{fontSize: 76, lineHeight: 88}}>{labelEmoji}</Text>
                        )}

                        {/* Hit flash */}
                        <Animated.View
                            pointerEvents="none"
                            style={{
                                position:        'absolute',
                                width:           '100%',
                                height:          '100%',
                                borderRadius:    BOSS_SIZE / 2,
                                backgroundColor: '#fff',
                                opacity:         hitOpacity,
                            }}
                        />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Floating damage numbers */}
                {floats.map(id => (
                    <DamageFloat key={id} onDone={() => setFloats(prev => prev.filter(f => f !== id))}/>
                ))}
            </Animated.View>
        </Animated.View>
    );
}

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(BossBox);
