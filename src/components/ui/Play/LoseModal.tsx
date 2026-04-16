import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

// icons
import Coin from '../../../assets/icons/Coin.tsx';
import FullHeart from '../../../assets/icons/FullHeart.tsx';

// colors
import {
    BLUISH_PURPLE,
    DARK_PURPLE,
    GOLD,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    ORCHID,
    PLUM,
    PURPLE,
    PURPLE_LIGHT,
    WHITE,
    WHITE_100,
} from '../../../constants/colors.ts';

interface LoseModalProps {
    visible: boolean;
    score: number;
    onRetry: () => void;
    onBack: () => void;
    onWatchAd: () => void;
}

export default function LoseModal({visible, score, onRetry, onBack, onWatchAd}: LoseModalProps) {
    const {t} = useTranslation();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const heartAnim = useRef(new Animated.Value(1)).current;
    const adPulseAnim = useRef(new Animated.Value(1)).current;
    const starsAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) return;

        scaleAnim.setValue(0);
        starsAnim.setValue(0);

        // Modal bounce in
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 55,
            useNativeDriver: true,
        }).start();

        // Stars fade in
        Animated.timing(starsAnim, {
            toValue: 1,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
        }).start();

        // Title glow loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();

        // Heart beat
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartAnim, {
                    toValue: 1.25,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(heartAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Ad button pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(adPulseAnim, {
                    toValue: 1.05,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(adPulseAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [visible]);

    const titleColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [ORCHID, PURPLE_LIGHT],
    });

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                {/* Stars decoration */}
                <Animated.Text style={[styles.stars, {opacity: starsAnim}]}>
                    ✨ ⭐ 💫 ⭐ ✨
                </Animated.Text>

                {/* Broken heart */}
                <Animated.Text style={[styles.mainEmoji, {transform: [{scale: heartAnim}]}]}>
                    💔
                </Animated.Text>

                {/* Title */}
                <Animated.Text style={[styles.title, {color: titleColor}]}>
                    {t('gameOver')}
                </Animated.Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>{t('lostLevel')}</Text>

                {/* Score card */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                    style={styles.scoreCard}
                >
                    <Text style={styles.scoreLabel}>{t('score')}</Text>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreValue}>{score}</Text>
                        <Coin width={28} height={28}/>
                    </View>
                </LinearGradient>

                {/* Watch Ad button */}
                <Animated.View style={[styles.adBtnWrap, {transform: [{scale: adPulseAnim}]}]}>
                    <TouchableOpacity onPress={onWatchAd} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#f7971e', '#ffd200']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.adBtn}
                        >
                            <Text style={styles.adBtnIcon}>📺</Text>
                            <View style={styles.adBtnTextWrap}>
                                <Text style={styles.adBtnTitle}>{t('watchAd')}</Text>
                                <View style={styles.adBtnBadge}>
                                    <FullHeart size={14} color="#e74c3c"/>
                                    <Text style={styles.adBtnBadgeText}> {t('getHeart')}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Retry + Back row */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← {t('back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onRetry} activeOpacity={0.8} style={styles.retryWrap}>
                        <LinearGradient
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.retryBtn}
                        >
                            <Text style={styles.retryBtnText}>🔄 {t('retry')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '88%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: 32,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.35)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    stars: {
        fontSize: 18,
        letterSpacing: 4,
        marginBottom: 6,
    },
    mainEmoji: {
        fontSize: 64,
        marginBottom: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 6,
        textShadowColor: PURPLE_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 12,
    },
    subtitle: {
        color: WHITE_100,
        fontSize: 15,
        marginBottom: 20,
        textAlign: 'center',
        opacity: 0.8,
    },
    scoreCard: {
        width: '100%',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scoreLabel: {
        color: PLUM,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scoreValue: {
        color: GOLD,
        fontSize: 36,
        fontWeight: '900',
    },
    adBtnWrap: {
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 14,
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    adBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 14,
        borderRadius: 18,
    },
    adBtnIcon: {
        fontSize: 32,
    },
    adBtnTextWrap: {
        flex: 1,
    },
    adBtnTitle: {
        color: DARK_PURPLE,
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    adBtnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    adBtnBadgeText: {
        color: DARK_PURPLE,
        fontSize: 13,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    backBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: PURPLE,
        alignItems: 'center',
    },
    backBtnText: {
        color: WHITE,
        fontSize: 15,
        fontWeight: '600',
    },
    retryWrap: {
        flex: 2,
        borderRadius: 16,
        overflow: 'hidden',
    },
    retryBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
    },
    retryBtnText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
