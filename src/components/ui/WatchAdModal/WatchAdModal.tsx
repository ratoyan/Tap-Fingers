import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {isTablet, ms, SW, vs} from '../../../utils/responsive.ts';
import Coin from '../../../assets/icons/Coin.tsx';
import {
    BLUISH_PURPLE,
    DARK_PURPLE,
    GOLD,
    PURPLE,
    WHITE,
    WHITE_100,
} from '../../../constants/colors.ts';

const AD_DURATION = 5;

type Phase = 'confirm' | 'watching';

interface WatchAdModalProps {
    visible: boolean;
    onCollect: () => void;
    onClose: () => void;
}

export default function WatchAdModal({visible, onCollect, onClose}: WatchAdModalProps) {
    const {t} = useTranslation();
    const [phase, setPhase] = useState<Phase>('confirm');
    const [countdown, setCountdown] = useState(AD_DURATION);
    const [done, setDone] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!visible) {
            setPhase('confirm');
            setCountdown(AD_DURATION);
            setDone(false);
            progressAnim.setValue(0);
            return;
        }
        scaleAnim.setValue(0);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 55,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    useEffect(() => {
        if (!visible || phase !== 'watching') return;

        progressAnim.setValue(0);
        setCountdown(AD_DURATION);
        setDone(false);

        progressAnimation.current = Animated.timing(progressAnim, {
            toValue: 1,
            duration: AD_DURATION * 1000,
            useNativeDriver: false,
        });
        progressAnimation.current.start();

        let remaining = AD_DURATION;
        const interval = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                setDone(true);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            progressAnimation.current?.stop();
        };
    }, [phase, visible]);

    if (!visible) return null;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                {phase === 'confirm' ? (
                    <>
                        <Text allowFontScaling={false} style={styles.confirmEmoji}>📺</Text>
                        <Text allowFontScaling={false} style={styles.confirmTitle}>
                            {t('watchAdQuestion')}
                        </Text>
                        <View style={styles.confirmReward}>
                            <Coin width={22} height={20}/>
                            <Text allowFontScaling={false} style={styles.confirmRewardText}>+10</Text>
                        </View>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={styles.noBtn}>
                                <Text allowFontScaling={false} style={styles.noBtnText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setPhase('watching')} activeOpacity={0.85} style={styles.yesWrap}>
                                <LinearGradient
                                    colors={['#f7971e', '#ffd200']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.yesBtn}
                                >
                                    <Text allowFontScaling={false} style={styles.yesBtnText}>{t('watchAd')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.adBadge}>
                            <Text allowFontScaling={false} style={styles.adBadgeText}>📺 AD</Text>
                        </View>

                        <LinearGradient
                            colors={['#0f0f0f', '#1a1a2e', '#0f0f0f']}
                            style={styles.videoArea}
                        >
                            <Text allowFontScaling={false} style={styles.videoEmoji}>🎬</Text>
                            {!done && (
                                <View style={styles.countdownBadge}>
                                    <Text allowFontScaling={false} style={styles.countdownText}>{countdown}s</Text>
                                </View>
                            )}
                        </LinearGradient>

                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, {width: progressWidth}]}/>
                        </View>

                        <View style={styles.rewardRow}>
                            <Coin width={22} height={20}/>
                            <Text allowFontScaling={false} style={styles.rewardText}>+10</Text>
                        </View>

                        {done ? (
                            <TouchableOpacity onPress={onCollect} activeOpacity={0.85} style={styles.collectWrap}>
                                <LinearGradient
                                    colors={['#f7971e', '#ffd200']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.collectBtn}
                                >
                                    <Text allowFontScaling={false} style={styles.collectBtnText}>
                                        {t('collectCoins')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.waitBtn}>
                                <Text allowFontScaling={false} style={styles.waitBtnText}>
                                    {t('waitSeconds', {count: countdown})}
                                </Text>
                            </View>
                        )}

                        {done && (
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text allowFontScaling={false} style={styles.closeBtnText}>{t('close')}</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: isTablet ? Math.min(SW * 0.55, 480) : '85%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(28),
        paddingVertical: vs(24),
        paddingHorizontal: ms(20),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.35)',
        shadowColor: PURPLE,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    confirmEmoji: {
        fontSize: ms(52),
        marginBottom: vs(12),
    },
    confirmTitle: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: vs(14),
        lineHeight: ms(24),
    },
    confirmReward: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
        marginBottom: vs(22),
    },
    confirmRewardText: {
        color: GOLD,
        fontSize: ms(26),
        fontWeight: '900',
    },
    confirmActions: {
        flexDirection: 'row',
        width: '100%',
        gap: ms(12),
    },
    noBtn: {
        flex: 1,
        paddingVertical: vs(14),
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
    },
    noBtnText: {
        color: WHITE_100,
        fontSize: ms(15),
        fontWeight: '600',
    },
    yesWrap: {
        flex: 2,
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    yesBtn: {
        paddingVertical: vs(14),
        alignItems: 'center',
        borderRadius: ms(16),
    },
    yesBtnText: {
        color: DARK_PURPLE,
        fontSize: ms(16),
        fontWeight: '900',
    },
    adBadge: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(8),
        paddingHorizontal: ms(8),
        paddingVertical: vs(3),
        marginBottom: vs(10),
    },
    adBadgeText: {
        color: WHITE_100,
        fontSize: ms(11),
        fontWeight: '700',
        letterSpacing: 1,
    },
    videoArea: {
        width: '100%',
        height: vs(160),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(12),
        overflow: 'hidden',
    },
    videoEmoji: {
        fontSize: ms(52),
    },
    countdownBadge: {
        position: 'absolute',
        top: ms(8),
        right: ms(8),
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: ms(8),
        paddingHorizontal: ms(8),
        paddingVertical: vs(3),
    },
    countdownText: {
        color: WHITE,
        fontSize: ms(13),
        fontWeight: '800',
    },
    progressTrack: {
        width: '100%',
        height: vs(6),
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(4),
        overflow: 'hidden',
        marginBottom: vs(16),
    },
    progressFill: {
        height: '100%',
        backgroundColor: GOLD,
        borderRadius: ms(4),
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
        marginBottom: vs(14),
    },
    rewardText: {
        color: GOLD,
        fontSize: ms(26),
        fontWeight: '900',
    },
    collectWrap: {
        width: '100%',
        borderRadius: ms(16),
        overflow: 'hidden',
        marginBottom: vs(10),
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    collectBtn: {
        paddingVertical: vs(14),
        alignItems: 'center',
        borderRadius: ms(16),
    },
    collectBtnText: {
        color: DARK_PURPLE,
        fontSize: ms(17),
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    waitBtn: {
        width: '100%',
        paddingVertical: vs(14),
        alignItems: 'center',
        borderRadius: ms(16),
        marginBottom: vs(10),
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    waitBtnText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: ms(15),
        fontWeight: '700',
    },
    closeBtn: {
        paddingVertical: vs(10),
        paddingHorizontal: ms(20),
    },
    closeBtnText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: ms(13),
        fontWeight: '600',
        letterSpacing: 1,
    },
});
