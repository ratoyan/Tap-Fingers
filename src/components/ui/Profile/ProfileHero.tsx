import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle} from 'react-native-svg';

import PressScale from '../PressScale/PressScale.tsx';
import Ghost from '../../../assets/icons/Ghost.tsx';
import {GOLD, ORCHID, WHITE} from '../../../constants/colors.ts';
import {ms, vs} from '../../../utils/responsive.ts';

// ── Profile hero ────────────────────────────────────────────────────────────
// The identity panel at the top of the Profile screen: the player's face, their
// name, and what kind of account they're on. Everything below it on that screen
// is a form, so this is the one place that gets to look like a trophy shelf.
//
// Four looping animations, all native-driven and all deliberately slow — this
// screen is read, not played, and anything brisk turns into fidgeting:
//
//   halo    a soft glow behind the portrait, breathing
//   ring    two dashed arcs orbiting the portrait in opposite directions
//   gloss   the app's -18° highlight raking across the panel (as on the shop
//           items, the notice card and the lucky wheel)
//   float   ghost-only bob, for the guest view's mascot
//
// The portrait is the panel's own business: pass `onPressAvatar` and it becomes
// a button with a camera badge; leave it out (guests) and it's just artwork.

const AVATAR = ms(122);
const RING = AVATAR + ms(26);
const HALO = AVATAR + ms(54);

const GLOSS_MS = 3400;
const BREATHE_MS = 1700;
const RING_MS = 22000;
const FLOAT_MS = 1900;

type ChipTone = 'guest' | 'email' | 'social';

const CHIP_TONES: Record<ChipTone, {bg: string; border: string; text: string}> = {
    guest:  {bg: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.30)', text: WHITE},
    email:  {bg: 'rgba(142,45,226,0.30)',  border: 'rgba(206,147,216,0.55)', text: '#F3E1FF'},
    social: {bg: 'rgba(0,229,255,0.16)',   border: 'rgba(0,229,255,0.45)',   text: '#BFF6FF'},
};

interface ProfileHeroProps {
    /** Small line above the portrait — the localized greeting. */
    eyebrow?: string;
    name: string;
    /** Short account-type label shown in the chip under the name. */
    chip: string;
    chipTone?: ChipTone;
    chipAccessibilityLabel?: string;
    /** Portrait: an uploaded photo wins, otherwise the deterministic fallback. */
    photo?: string;
    fallbackEmoji?: string;
    fallbackColors?: string[];
    /** Renders the ghost mascot instead of a portrait (guest view). */
    ghost?: boolean;
    uploading?: boolean;
    /** Present → the portrait is tappable and carries a camera badge. */
    onPressAvatar?: () => void;
    photoHint?: string;
    email?: string | null;
    emailVerified?: boolean;
    /** Extra rows under the chip (the guest id line, for one). */
    children?: React.ReactNode;
}

function ProfileHero({
    eyebrow,
    name,
    chip,
    chipTone = 'email',
    chipAccessibilityLabel,
    photo,
    fallbackEmoji = '👆',
    fallbackColors = ['#8E2DE2', '#4A00E0'],
    ghost = false,
    uploading = false,
    onPressAvatar,
    photoHint,
    email,
    emailVerified,
    children,
}: ProfileHeroProps) {
    const gloss = useRef(new Animated.Value(0)).current;
    const breathe = useRef(new Animated.Value(0)).current;
    const orbit = useRef(new Animated.Value(0)).current;
    const float = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loops = [
            // One-way rake: the band snaps back off-panel with a 0ms leg rather
            // than sliding backwards through the artwork.
            Animated.loop(Animated.sequence([
                Animated.timing(gloss, {toValue: 1, duration: GLOSS_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
                Animated.timing(gloss, {toValue: 0, duration: 0, useNativeDriver: true}),
            ])),
            Animated.loop(Animated.sequence([
                Animated.timing(breathe, {toValue: 1, duration: BREATHE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                Animated.timing(breathe, {toValue: 0, duration: BREATHE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            ])),
            Animated.loop(
                Animated.timing(orbit, {toValue: 1, duration: RING_MS, easing: Easing.linear, useNativeDriver: true}),
            ),
        ];
        if (ghost) {
            loops.push(Animated.loop(Animated.sequence([
                Animated.timing(float, {toValue: 1, duration: FLOAT_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
                Animated.timing(float, {toValue: 0, duration: FLOAT_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            ])));
        }
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [gloss, breathe, orbit, float, ghost]);

    const glossX = gloss.interpolate({inputRange: [0, 1], outputRange: [-ms(160), ms(420)]});
    const haloOpacity = breathe.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]});
    const haloScale = breathe.interpolate({inputRange: [0, 1], outputRange: [0.94, 1.06]});
    const spin = orbit.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const spinBack = orbit.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-360deg']});
    const bob = float.interpolate({inputRange: [0, 1], outputRange: [0, -vs(9)]});

    const tone = CHIP_TONES[chipTone];

    const portrait = ghost ? (
        <Animated.View style={{transform: [{translateY: bob}]}}>
            <Ghost size={AVATAR * 0.86} color="rgba(255,255,255,0.92)" eyeColor="#6a0dad" />
        </Animated.View>
    ) : photo ? (
        <Image
            source={{uri: photo}}
            style={styles.avatar}
            accessibilityRole="image"
            accessibilityLabel="Profile photo"
        />
    ) : (
        <LinearGradient
            colors={fallbackColors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.avatar, styles.avatarFallback]}
        >
            <Text allowFontScaling={false} style={styles.avatarEmoji}>{fallbackEmoji}</Text>
        </LinearGradient>
    );

    return (
        <LinearGradient
            colors={['rgba(142,45,226,0.42)', 'rgba(74,0,224,0.20)', 'rgba(26,0,53,0.35)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.panel}
        >
            {/* Raking highlight. Taller than the panel so the skew can't clip a
                wedge out of the top and bottom corners. */}
            <Animated.View
                pointerEvents="none"
                style={[styles.gloss, {transform: [{translateX: glossX}, {skewX: '-18deg'}]}]}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {!!eyebrow && (
                <Text allowFontScaling={false} style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
            )}

            <View style={styles.portraitZone}>
                {/* Breathing glow, behind everything. Three nested discs rather
                    than one: react-native can't blur a view, and a single
                    translucent circle reads as exactly that — a flat pale disc
                    with a hard rim. Stepping the alpha down as the discs grow
                    fakes the falloff a blur would give. */}
                <Animated.View
                    pointerEvents="none"
                    style={[styles.haloWrap, {opacity: haloOpacity, transform: [{scale: haloScale}]}]}
                >
                    <View style={[styles.haloDisc, styles.haloOuter]} />
                    <View style={[styles.haloDisc, styles.haloMid]} />
                    <View style={[styles.haloDisc, styles.haloInner]} />
                </Animated.View>

                {/* Orbiting dashed arcs — two rings turning against each other
                    read as motion even at this speed, where a single one would
                    just look like a static border. */}
                <Animated.View pointerEvents="none" style={[styles.ring, {transform: [{rotate: spin}]}]}>
                    <Svg width={RING} height={RING}>
                        <Circle
                            cx={RING / 2} cy={RING / 2} r={RING / 2 - 2}
                            stroke={ORCHID} strokeWidth={2} fill="none"
                            strokeDasharray="26 16" strokeOpacity={0.75}
                        />
                    </Svg>
                </Animated.View>
                <Animated.View pointerEvents="none" style={[styles.ring, {transform: [{rotate: spinBack}]}]}>
                    <Svg width={RING} height={RING}>
                        <Circle
                            cx={RING / 2} cy={RING / 2} r={RING / 2 - ms(7)}
                            stroke={GOLD} strokeWidth={1.5} fill="none"
                            strokeDasharray="6 22" strokeOpacity={0.6}
                        />
                    </Svg>
                </Animated.View>

                {onPressAvatar ? (
                    <PressScale
                        onPress={onPressAvatar}
                        scaleTo={0.93}
                        activeOpacity={0.9}
                        wrapperStyle={styles.avatarPress}
                        accessibilityLabel={photoHint}
                    >
                        <View>
                            {portrait}
                            <View style={[styles.cameraBadge, uploading && styles.cameraBadgeBusy]}>
                                {uploading
                                    ? <ActivityIndicator size="small" color={WHITE} />
                                    : <Text allowFontScaling={false} style={styles.cameraIcon}>📷</Text>}
                            </View>
                        </View>
                    </PressScale>
                ) : (
                    portrait
                )}
            </View>

            {!!photoHint && !!onPressAvatar && (
                <Text allowFontScaling={false} style={styles.photoHint}>{photoHint}</Text>
            )}

            <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{name}</Text>

            <View style={[styles.chip, {backgroundColor: tone.bg, borderColor: tone.border}]}>
                <Text
                    allowFontScaling={false}
                    style={[styles.chipText, {color: tone.text}]}
                    accessibilityLabel={chipAccessibilityLabel}
                >
                    {chip}
                </Text>
            </View>

            {!!email && (
                <Text allowFontScaling={false} style={styles.email} numberOfLines={1}>
                    {emailVerified ? '✅' : '⏳'}  {email}
                </Text>
            )}

            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    panel: {
        width: '100%',
        borderRadius: ms(28),
        paddingTop: vs(20),
        paddingBottom: vs(18),
        paddingHorizontal: ms(18),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
        shadowColor: '#8E2DE2',
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 12,
    },
    gloss: {
        position: 'absolute',
        top: -vs(30),
        bottom: -vs(30),
        width: ms(110),
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: ms(13),
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: vs(6),
        maxWidth: '90%',
    },
    portraitZone: {
        width: HALO,
        height: HALO,
        alignItems: 'center',
        justifyContent: 'center',
    },
    haloWrap: {
        position: 'absolute',
        width: HALO,
        height: HALO,
        alignItems: 'center',
        justifyContent: 'center',
    },
    haloDisc: {
        position: 'absolute',
    },
    haloOuter: {
        width: HALO,
        height: HALO,
        borderRadius: HALO / 2,
        backgroundColor: 'rgba(218,112,214,0.10)',
    },
    haloMid: {
        width: HALO - ms(20),
        height: HALO - ms(20),
        borderRadius: (HALO - ms(20)) / 2,
        backgroundColor: 'rgba(218,112,214,0.13)',
    },
    haloInner: {
        width: HALO - ms(40),
        height: HALO - ms(40),
        borderRadius: (HALO - ms(40)) / 2,
        backgroundColor: 'rgba(238,130,238,0.16)',
    },
    ring: {
        position: 'absolute',
        width: RING,
        height: RING,
    },
    avatarPress: {
        alignSelf: 'center',
    },
    avatar: {
        width: AVATAR,
        height: AVATAR,
        borderRadius: AVATAR / 2,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.85)',
    },
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarEmoji: {
        fontSize: ms(60),
        textAlign: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        right: -ms(2),
        bottom: -ms(2),
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        backgroundColor: '#3A0A5C',
        borderWidth: 2,
        borderColor: WHITE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadgeBusy: {
        backgroundColor: '#5B1090',
    },
    cameraIcon: {
        fontSize: ms(16),
    },
    photoHint: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: ms(12),
        fontWeight: '600',
        letterSpacing: 0.4,
        marginTop: vs(8),
    },
    name: {
        color: WHITE,
        fontSize: ms(26),
        fontWeight: '900',
        letterSpacing: 0.6,
        marginTop: vs(8),
        textShadowColor: 'rgba(238,130,238,0.65)',
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 14,
    },
    chip: {
        marginTop: vs(9),
        paddingHorizontal: ms(14),
        paddingVertical: vs(5),
        borderRadius: ms(999),
        borderWidth: 1,
    },
    chipText: {
        fontSize: ms(11.5),
        fontWeight: '800',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    email: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: ms(13),
        marginTop: vs(9),
        letterSpacing: 0.2,
        maxWidth: '92%',
        textAlign: 'center',
    },
});

export default React.memo(ProfileHero);
