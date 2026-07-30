import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {ms, vs} from '../../../utils/responsive.ts';
import {GOLD} from '../../../constants/colors.ts';
import {FERRIS_ASPECT, FerrisWheelRim, FerrisWheelStand} from '../../../assets/icons/FerrisWheelIcon.tsx';

// Diameter of the wheel art — roughly where the 🎡 glyph sat before.
const WHEEL_SIZE = ms(34);

interface LuckyWheelButtonProps {
    canSpin: boolean;
    top: number;
    onPress: () => void;
}

export default function LuckyWheelButton({canSpin, top, onPress}: LuckyWheelButtonProps) {
    const {t} = useTranslation();
    const scaleAnim = useRef(new Animated.Value(1)).current;   // press feedback
    const glowAnim = useRef(new Animated.Value(0)).current;    // border glow
    const spinAnim = useRef(new Animated.Value(0)).current;    // wheel rotation
    const pulseAnim = useRef(new Animated.Value(1)).current;   // attention breathe
    const haloAnim = useRef(new Animated.Value(0)).current;    // halo pulse

    // The wheel always turns — quickly with a glowing halo when a free spin is
    // ready, slow and calm otherwise.
    useEffect(() => {
        const spin = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: canSpin ? 3500 : 9000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        spin.start();
        return () => {
            spin.stop();
            spinAnim.setValue(0);
        };
    }, [canSpin]);

    // Border glow + breathe + halo, only while a free spin is available.
    useEffect(() => {
        if (!canSpin) {
            glowAnim.setValue(0);
            pulseAnim.setValue(1);
            haloAnim.setValue(0);
            return;
        }
        const glow = Animated.loop(Animated.sequence([
            Animated.timing(glowAnim, {toValue: 1, duration: 900, useNativeDriver: true}),
            Animated.timing(glowAnim, {toValue: 0, duration: 900, useNativeDriver: true}),
        ]));
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, {toValue: 1.06, duration: 850, useNativeDriver: true}),
            Animated.timing(pulseAnim, {toValue: 1, duration: 850, useNativeDriver: true}),
        ]));
        const halo = Animated.loop(Animated.sequence([
            Animated.timing(haloAnim, {toValue: 1, duration: 850, useNativeDriver: true}),
            Animated.timing(haloAnim, {toValue: 0, duration: 850, useNativeDriver: true}),
        ]));
        glow.start();
        pulse.start();
        halo.start();
        return () => {
            glow.stop();
            pulse.stop();
            halo.stop();
        };
    }, [canSpin]);

    // The glow varied only the alpha of one fixed gold, so instead of animating
    // borderColor (JS-thread only) the ring keeps a dim constant border and a
    // full-brightness copy is faded in over it with opacity — native-drivable.
    // It matters here more than elsewhere: this loop runs continuously on Home
    // for as long as a free spin is available.
    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });
    const rotate = spinAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const haloScale = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.9, 1.25]});
    const haloOpacity = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.2, 0.55]});

    return (
        <View style={[styles.wrapper, {top}]}>
            {/* Pulsing glow halo — only when a free spin is ready. */}
            {canSpin && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.halo, {opacity: haloOpacity, transform: [{scale: haloScale}]}]}
                />
            )}

            <Animated.View style={{transform: [{scale: Animated.multiply(scaleAnim, pulseAnim)}]}}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={canSpin ? t('luckyWheelFreeLabel') : t('luckyWheelLabel')}
                    onPressIn={() =>
                        Animated.spring(scaleAnim, {toValue: 0.88, useNativeDriver: true}).start()
                    }
                    onPressOut={() =>
                        Animated.spring(scaleAnim, {toValue: 1, friction: 4, useNativeDriver: true}).start()
                    }
                    onPress={onPress}
                >
                    <View>
                    <Animated.View style={styles.outerRing}>
                        <LinearGradient
                            colors={['#3a0072', '#1e0040', '#0a0018']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.gradient}
                        >
                            {/* Glossy top sheen for a polished, glassy finish. */}
                            <LinearGradient
                                colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0)']}
                                style={styles.sheen}
                                pointerEvents="none"
                            />
                            {/* Only the wheel turns. The spinner layer is a
                                square whose centre is the hub, so `rotate`
                                pivots exactly there; the stand sits in flow on
                                top of it and never moves. */}
                            <View style={styles.wheelIcon}>
                                <Animated.View style={[styles.wheelSpinner, {transform: [{rotate}]}]}>
                                    <FerrisWheelRim size={WHEEL_SIZE}/>
                                </Animated.View>
                                <FerrisWheelStand size={WHEEL_SIZE}/>
                            </View>
                            <View style={styles.divider}/>
                            <Text allowFontScaling={false} style={styles.label}>{t('spinShort')}</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Sibling, not a child: outerRing is overflow:hidden, so an
                        overlay inside it would be clipped away. The plain View
                        wrapper sizes itself to the ring, which lets this match
                        it exactly with absoluteFill and no measuring. */}
                    <Animated.View
                        style={[styles.glowRing, {opacity: glowOpacity}]}
                        pointerEvents="none"
                    />
                    </View>

                    {canSpin && (
                        <View style={styles.freeBadge}>
                            <Text allowFontScaling={false} style={styles.freeBadgeText}>{t('freeSpinBadge')}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: ms(14),
        zIndex: 20,
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
    },
    halo: {
        position: 'absolute',
        top: vs(-7),
        left: ms(-11),
        right: ms(-11),
        bottom: vs(-7),
        borderRadius: ms(40),
        backgroundColor: 'rgba(255,205,0,0.35)',
    },
    outerRing: {
        borderRadius: ms(22),
        borderWidth: 2,
        // The dim end of the pulse, held constant. glowRing fades the bright
        // copy in over it.
        borderColor: 'rgba(255,215,0,0.45)',
        overflow: 'hidden',
        backgroundColor: '#0a0018',
    },
    glowRing: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: ms(22),
        borderWidth: 2,
        borderColor: 'rgba(255,215,0,1)',
    },
    gradient: {
        width: ms(72),
        paddingTop: vs(11),
        paddingBottom: vs(9),
        alignItems: 'center',
        gap: vs(4),
    },
    sheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '46%',
    },
    wheelIcon: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE * FERRIS_ASPECT,
    },
    wheelSpinner: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
    },
    divider: {
        width: '60%',
        height: 1.5,
        borderRadius: 1,
        backgroundColor: 'rgba(255,215,0,0.4)',
    },
    label: {
        color: GOLD,
        fontSize: ms(9),
        fontWeight: '900',
        letterSpacing: ms(2),
        textShadowColor: 'rgba(255,200,0,0.6)',
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 6,
    },
    freeBadge: {
        position: 'absolute',
        top: ms(-9),
        right: ms(-10),
        backgroundColor: '#e63000',
        borderRadius: ms(10),
        paddingHorizontal: ms(6),
        paddingVertical: vs(2.5),
        borderWidth: 1.5,
        borderColor: '#fff',
        shadowColor: '#ff5a1f',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 8,
    },
    freeBadgeText: {
        color: '#fff',
        fontSize: ms(8),
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
