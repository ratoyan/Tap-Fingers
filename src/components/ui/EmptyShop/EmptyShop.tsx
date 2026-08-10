import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import Svg, {Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop} from 'react-native-svg';

import {ms} from '../../../utils/responsive.ts';
import {GOLD, GRADIENT_DARK, GRADIENT_LIGHT} from '../../../constants/colors.ts';

import styles from './EmptyShop.style.ts';

interface EmptyShopProps {
    onRetry?: () => void;
}

// Shown in the shop content area when the item lists fail to load (offline or a
// server error leaves both grids empty). It gives the blank state some life and
// a way back — a floating bag, a soft pulsing halo, and a Try Again button.
function EmptyShop({onRetry}: EmptyShopProps) {
    const {t} = useTranslation();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const riseAnim = useRef(new Animated.Value(24)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const haloAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const ctaScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(riseAnim, {
                toValue: 0,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Idle loops — a gentle bag bob, a breathing halo and a twinkle. All
        // collected so they stop cleanly when the grid loads and this unmounts.
        const loops = [
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: 1,
                        duration: 1600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 1600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(haloAnim, {
                        toValue: 1,
                        duration: 1900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(haloAnim, {
                        toValue: 0,
                        duration: 1900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(sparkleAnim, {
                        toValue: 1,
                        duration: 2100,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(sparkleAnim, {
                        toValue: 0,
                        duration: 2100,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ),
        ];
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [fadeAnim, riseAnim, floatAnim, haloAnim, sparkleAnim]);

    const floatY = floatAnim.interpolate({inputRange: [0, 1], outputRange: [6, -6]});
    const haloScale = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.9, 1.08]});
    const haloOpacity = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.4, 0.72]});
    const sparkleOpacity = sparkleAnim.interpolate({inputRange: [0, 1], outputRange: [0.3, 1]});
    const sparkleScale = sparkleAnim.interpolate({inputRange: [0, 1], outputRange: [0.8, 1.18]});

    return (
        <Animated.View
            style={[
                styles.container,
                {opacity: fadeAnim, transform: [{translateY: riseAnim}]},
            ]}
            accessible
            accessibilityLabel={t('shopEmptyTitle')}
        >
            <View style={styles.illustrationWrap}>
                <Animated.View
                    style={[
                        styles.halo,
                        {opacity: haloOpacity, transform: [{scale: haloScale}]},
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(218,112,214,0.55)', 'rgba(142,45,226,0.18)', 'rgba(74,0,224,0)']}
                        style={styles.haloGradient}
                    />
                </Animated.View>

                <Animated.Text
                    style={[
                        styles.sparkleTopLeft,
                        {opacity: sparkleOpacity, transform: [{scale: sparkleScale}]},
                    ]}
                    allowFontScaling={false}
                >
                    ✦
                </Animated.Text>
                <Animated.Text
                    style={[
                        styles.sparkleTopRight,
                        {opacity: sparkleOpacity, transform: [{scale: sparkleScale}]},
                    ]}
                    allowFontScaling={false}
                >
                    ✧
                </Animated.Text>
                <Animated.Text
                    style={[
                        styles.sparkleBottomLeft,
                        {opacity: sparkleOpacity, transform: [{scale: sparkleScale}]},
                    ]}
                    allowFontScaling={false}
                >
                    ✧
                </Animated.Text>

                <Animated.View style={[styles.iconCard, {transform: [{translateY: floatY}]}]}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.iconCardGradient}
                    >
                        <Svg width={ms(72)} height={ms(72)} viewBox="0 0 64 64" fill="none">
                            <Defs>
                                <SvgLinearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#D78BE0" />
                                    <Stop offset="1" stopColor="#8E2DE2" />
                                </SvgLinearGradient>
                            </Defs>
                            {/* Handle */}
                            <Path
                                d="M23 22v-4a9 9 0 0 1 18 0v4"
                                stroke={GOLD}
                                strokeWidth={3}
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* Bag body */}
                            <Path
                                d="M16 22h32l-2.5 26a4 4 0 0 1-4 3.6H22.5a4 4 0 0 1-4-3.6L16 22z"
                                fill="url(#bagGrad)"
                                stroke="rgba(255,255,255,0.28)"
                                strokeWidth={1}
                            />
                            {/* Gloss highlight */}
                            <Path
                                d="M21 26h4l-1.5 22"
                                stroke="rgba(255,255,255,0.30)"
                                strokeWidth={2}
                                strokeLinecap="round"
                                fill="none"
                            />
                            <Circle cx={32} cy={34} r={3.2} fill="rgba(255,255,255,0.6)" />
                        </Svg>
                    </LinearGradient>
                </Animated.View>
            </View>

            <Text allowFontScaling={false} style={styles.title}>
                {t('shopEmptyTitle')}
            </Text>

            <Text allowFontScaling={false} style={styles.subtitle}>
                {t('shopEmptySubtitle')}
            </Text>

            {onRetry && (
                <Animated.View style={[styles.ctaWrap, {transform: [{scale: ctaScale}]}]}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onRetry}
                        onPressIn={() =>
                            Animated.spring(ctaScale, {
                                toValue: 0.96,
                                useNativeDriver: true,
                            }).start()
                        }
                        onPressOut={() =>
                            Animated.spring(ctaScale, {
                                toValue: 1,
                                friction: 4,
                                useNativeDriver: true,
                            }).start()
                        }
                        accessibilityRole="button"
                        accessibilityLabel={t('shopRetry')}
                    >
                        <View style={styles.ctaButton}>
                            {/* Gradient behind the content as an absolute fill so the
                                button measures from its children and never clips the
                                label — a LinearGradient laid out around content
                                mis-sizes on iOS's new architecture.
                                See linear-gradient-ios-clip. */}
                            <LinearGradient
                                colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.ctaGradientFill}
                            />
                            <View style={styles.ctaIcon}>
                                <Text allowFontScaling={false} style={styles.ctaIconText}>
                                    ↻
                                </Text>
                            </View>
                            <Text allowFontScaling={false} style={styles.ctaText}>
                                {t('shopRetry')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Animated.View>
    );
}

export default EmptyShop;
