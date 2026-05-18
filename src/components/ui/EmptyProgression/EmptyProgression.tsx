import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/core';
import {useTranslation} from 'react-i18next';
import Svg, {Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop} from 'react-native-svg';

import {ms} from '../../../utils/responsive.ts';
import {GOLD, GRADIENT_DARK, GRADIENT_LIGHT} from '../../../constants/colors.ts';

import styles from './EmptyProgression.style.ts';

interface EmptyProgressionProps {
    onPressCta?: () => void;
}

function EmptyProgression({onPressCta}: EmptyProgressionProps) {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const riseAnim = useRef(new Animated.Value(20)).current;
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

        Animated.loop(
            Animated.sequence([
                Animated.timing(haloAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(haloAnim, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 2200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(sparkleAnim, {
                    toValue: 0,
                    duration: 2200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [fadeAnim, riseAnim, haloAnim, sparkleAnim]);

    const haloScale = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.92, 1.06]});
    const haloOpacity = haloAnim.interpolate({inputRange: [0, 1], outputRange: [0.45, 0.75]});
    const sparkleOpacity = sparkleAnim.interpolate({inputRange: [0, 1], outputRange: [0.35, 1]});
    const sparkleScale = sparkleAnim.interpolate({inputRange: [0, 1], outputRange: [0.85, 1.15]});

    const handleCtaPress = () => {
        if (onPressCta) {
            onPressCta();
            return;
        }
        navigation.navigate('Play');
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {opacity: fadeAnim, transform: [{translateY: riseAnim}]},
            ]}
            accessible
            accessibilityLabel={t('noProgressionTitle')}
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

                <View style={styles.iconCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.iconCardGradient}
                    >
                        <Svg width={ms(72)} height={ms(72)} viewBox="0 0 64 64" fill="none">
                            <Defs>
                                <SvgLinearGradient id="trophyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#FFE680" />
                                    <Stop offset="1" stopColor="#F2A900" />
                                </SvgLinearGradient>
                                <SvgLinearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#D78BE0" />
                                    <Stop offset="1" stopColor="#8E2DE2" />
                                </SvgLinearGradient>
                            </Defs>
                            <Path
                                d="M20 10h24v8c0 7-5.5 12.5-12 12.5S20 25 20 18v-8z"
                                fill="url(#trophyGrad)"
                                stroke="rgba(255,255,255,0.35)"
                                strokeWidth={1}
                            />
                            <Path
                                d="M20 12h-5a4 4 0 0 0-4 4v3a6 6 0 0 0 6 6"
                                stroke={GOLD}
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                fill="none"
                                opacity={0.8}
                            />
                            <Path
                                d="M44 12h5a4 4 0 0 1 4 4v3a6 6 0 0 1-6 6"
                                stroke={GOLD}
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                fill="none"
                                opacity={0.8}
                            />
                            <Path
                                d="M28 30h8v6h-8z"
                                fill="url(#trophyGrad)"
                                opacity={0.9}
                            />
                            <Path
                                d="M22 38h20a2 2 0 0 1 2 2v4H20v-4a2 2 0 0 1 2-2z"
                                fill="url(#baseGrad)"
                            />
                            <Path
                                d="M18 46h28a2 2 0 0 1 2 2v3H16v-3a2 2 0 0 1 2-2z"
                                fill="url(#baseGrad)"
                                opacity={0.85}
                            />
                            <Circle cx={32} cy={20} r={3.5} fill="rgba(255,255,255,0.55)" />
                        </Svg>
                    </LinearGradient>
                </View>
            </View>

            <Text allowFontScaling={false} style={styles.title}>
                {t('noProgressionTitle')}
            </Text>

            <Text allowFontScaling={false} style={styles.subtitle}>
                {t('noProgressionSubtitle')}
            </Text>

            <Animated.View style={[styles.ctaWrap, {transform: [{scale: ctaScale}]}]}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCtaPress}
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
                    accessibilityLabel={t('startPlaying')}
                >
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.ctaButton}
                    >
                        <Text allowFontScaling={false} style={styles.ctaText}>
                            {t('startPlaying')}
                        </Text>
                        <Text allowFontScaling={false} style={styles.ctaArrow}>
                            →
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text allowFontScaling={false} style={styles.tipText}>
                    {t('progressionHint')}
                </Text>
            </View>
        </Animated.View>
    );
}

export default EmptyProgression;
