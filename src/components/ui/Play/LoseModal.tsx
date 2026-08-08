import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    StyleSheet,
    Share,
    Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {ms, vs, isTablet, SW} from '../../../utils/responsive.ts';

// icons
import Coin from '../../../assets/icons/Coin.tsx';
import FullHeart from '../../../assets/icons/FullHeart.tsx';
import RetryIcon from '../../../assets/icons/RetryIcon.tsx';
import BackArrowIcon from '../../../assets/icons/BackArrowIcon.tsx';
import ShareIcon from '../../../assets/icons/ShareIcon.tsx';

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

// Store link appended to the shared message so recipients can grab the game.
const APP_URL = Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/idYOUR_APP_ID'
    : 'https://play.google.com/store/apps/details?id=com.tapfingers';

interface LoseModalProps {
    visible: boolean;
    score: number;
    onRetry: () => void;
    onBack: () => void;
    onWatchAd: () => void;
    canWatchAd?: boolean;
    // Admin global ad switch — when false the whole watch-ad-for-heart block is hidden.
    adsEnabled?: boolean;
}

function LoseModal({visible, score, onRetry, onBack, onWatchAd, canWatchAd = true, adsEnabled = true}: LoseModalProps) {
    const {t} = useTranslation();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const heartAnim = useRef(new Animated.Value(1)).current;
    const adPulseAnim = useRef(new Animated.Value(1)).current;
    const starsAnim = useRef(new Animated.Value(0)).current;
    const retrySpinAnim = useRef(new Animated.Value(0)).current;

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

        // Every loop below is collected and stopped when the modal hides. They
        // used to be started and dropped, and this effect keys on `visible` —
        // so each game-over left another permanent set running, and a long
        // session accumulated one per death. The glow is the expensive one: it
        // animates a text colour, which the native driver can't do, so a leaked
        // copy costs JS-thread time on every frame forever.
        const loops: Animated.CompositeAnimation[] = [];

        // Title glow loop
        loops.push(Animated.loop(
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
        ));

        // Heart beat
        loops.push(Animated.loop(
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
        ));

        // Ad button pulse
        loops.push(Animated.loop(
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
        ));

        // Retry icon: one full turn, then a beat of rest — hints at "go again"
        // without spinning nonstop under the label.
        retrySpinAnim.setValue(0);
        loops.push(Animated.loop(
            Animated.sequence([
                Animated.delay(1200),
                Animated.timing(retrySpinAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ));

        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [visible]);

    async function handleShare() {
        try {
            await Share.share({
                message: `${t('shareScoreMessage', {score})}\n${APP_URL}`,
            });
        } catch {
            // User dismissed the share sheet, or it's unavailable — nothing to do.
        }
    }

    const titleColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [ORCHID, PURPLE_LIGHT],
    });

    const retrySpin = retrySpinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
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
                <Text allowFontScaling={false} style={styles.subtitle}>{t('lostLevel')}</Text>

                {/* Score card. The gradient is an absolute-fill background rather
                    than the sizing container: on iOS's new architecture a
                    react-native-linear-gradient sized by its own padding clips the
                    tall score row, so a plain View owns the layout and the gradient
                    just paints behind it. */}
                <View style={styles.scoreCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text allowFontScaling={false} style={styles.scoreLabel}>{t('score')}</Text>
                    <View style={styles.scoreRow}>
                        <Text allowFontScaling={false} style={styles.scoreValue}>{score}</Text>
                        <Coin width={28} height={28}/>
                    </View>
                </View>

                {/* Watch Ad button — hidden when ads disabled by admin or the
                    one-per-game revive has already been spent (canWatchAd false) */}
                {adsEnabled && canWatchAd && (
                    <Animated.View style={[styles.adBtnWrap, {transform: [{scale: adPulseAnim}]}]}>
                        <TouchableOpacity
                            onPressIn={onWatchAd}
                            activeOpacity={0.85}
                            style={styles.adBtn}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`${t('watchAd')}, ${t('getHeart')}`}
                        >
                            <LinearGradient
                                pointerEvents="none"
                                colors={['#f7971e', '#ffd200']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.adGradient}
                            />
                            <Text allowFontScaling={false} style={styles.adBtnIcon}>📺</Text>
                            <View style={styles.adBtnTextWrap}>
                                <Text allowFontScaling={false} style={styles.adBtnTitle}>{t('watchAd')}</Text>
                                <View style={styles.adBtnBadge}>
                                    <FullHeart size={14} color="#e74c3c"/>
                                    <Text allowFontScaling={false} style={styles.adBtnBadgeText}> {t('getHeart')}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Retry + Back row */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPressIn={onBack}
                        activeOpacity={0.75}
                        style={styles.backBtn}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('back')}
                    >
                        <BackArrowIcon size={ms(18)} color={WHITE}/>
                        <Text allowFontScaling={false} style={styles.backBtnText}>{t('back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPressIn={onRetry}
                        activeOpacity={0.8}
                        style={styles.retryWrap}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('retry')}
                    >
                        <LinearGradient
                            pointerEvents="none"
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.retryBtn}
                        />
                        <Animated.View style={{transform: [{rotate: retrySpin}]}}>
                            <RetryIcon size={ms(20)} color={WHITE}/>
                        </Animated.View>
                        <Text allowFontScaling={false} style={styles.retryBtnText}>{t('retry')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Share score — gradient-bordered glassy pill under the main
                    actions. Distinct from the gold ad button and solid retry. */}
                <TouchableOpacity
                    onPress={handleShare}
                    activeOpacity={0.85}
                    style={styles.shareWrap}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('shareScore')}
                >
                    <LinearGradient
                        colors={[ORCHID, PURPLE_LIGHT]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.shareBorder}
                    >
                        <View style={styles.shareInner}>
                            <ShareIcon size={ms(20)}/>
                            <Text allowFontScaling={false} style={styles.shareBtnText}>{t('shareScore')}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

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
        width: isTablet ? Math.min(SW * 0.6, 520) : '88%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(32),
        paddingVertical: vs(28),
        paddingHorizontal: ms(22),
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
        fontSize: ms(18),
        letterSpacing: 4,
        marginBottom: vs(6),
    },
    mainEmoji: {
        fontSize: ms(64),
        marginBottom: vs(8),
    },
    title: {
        fontSize: ms(34),
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: vs(6),
        textShadowColor: PURPLE_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 12,
    },
    subtitle: {
        color: WHITE_100,
        fontSize: ms(15),
        marginBottom: vs(20),
        textAlign: 'center',
        opacity: 0.8,
    },
    scoreCard: {
        width: '100%',
        borderRadius: ms(18),
        overflow: 'hidden',
        paddingVertical: vs(14),
        paddingHorizontal: ms(20),
        alignItems: 'center',
        marginBottom: vs(18),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scoreLabel: {
        color: PLUM,
        fontSize: ms(12),
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: vs(4),
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
    },
    scoreValue: {
        color: GOLD,
        fontSize: ms(36),
        fontWeight: '900',
    },
    adBtnWrap: {
        width: '100%',
        borderRadius: ms(18),
        overflow: 'hidden',
        marginBottom: vs(14),
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    adBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: vs(50),
        paddingHorizontal: ms(20),
        gap: ms(14),
        borderRadius: ms(18),
        overflow: 'hidden',
    },
    adGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    adBtnIcon: {
        fontSize: ms(32),
    },
    adBtnTextWrap: {
        flex: 1,
    },
    adBtnTitle: {
        color: DARK_PURPLE,
        fontSize: ms(17),
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    adBtnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: vs(2),
    },
    adBtnBadgeText: {
        color: DARK_PURPLE,
        fontSize: ms(13),
        fontWeight: '700',
    },
    adBtnDisabled: {
        width: '100%',
        borderRadius: ms(18),
        height: vs(50),
        paddingHorizontal: ms(20),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(14),
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    adBtnDisabledText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: ms(15),
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: ms(12),
    },
    backBtn: {
        flex: 1,
        flexDirection: 'row',
        height: vs(50),
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(6),
    },
    backBtnText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '600',
    },
    retryWrap: {
        flex: 2,
        flexDirection: 'row',
        height: vs(50),
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
        borderRadius: ms(16),
        overflow: 'hidden',
    },
    retryBtn: {
        ...StyleSheet.absoluteFillObject,
    },
    retryBtnText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    shareWrap: {
        width: '100%',
        marginTop: vs(14),
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: ORCHID,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.45,
        shadowRadius: 9,
        elevation: 6,
    },
    shareBorder: {
        borderRadius: ms(16),
        padding: ms(1.5),
    },
    shareInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(9),
        paddingVertical: vs(12),
        borderRadius: ms(15),
        // Glassy fill over the modal so the pill reads as its own surface
        // rather than a plain gradient outline.
        backgroundColor: 'rgba(46,20,66,0.85)',
    },
    shareBtnText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 0.4,
    },
});

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(LoseModal);
