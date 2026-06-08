import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isTablet, ms, SW, vs} from '../../../utils/responsive.ts';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import Coin from '../../../assets/icons/Coin.tsx';
import {BLUISH_PURPLE, DARK_PURPLE, GOLD, PURPLE, WHITE, WHITE_100} from '../../../constants/colors.ts';

const MAX_DAILY = 2;

interface DailyAdData {
    date: string;
    times: string[];
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadTodayData(): Promise<DailyAdData> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_AD_WATCHES);
    if (!raw) return {date: todayStr(), times: []};
    const parsed: DailyAdData = JSON.parse(raw);
    if (parsed.date !== todayStr()) return {date: todayStr(), times: []};
    return parsed;
}

async function saveWatch(data: DailyAdData): Promise<void> {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const updated = {...data, times: [...data.times, time]};
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_AD_WATCHES, JSON.stringify(updated));
}

interface WatchAdModalProps {
    visible: boolean;
    onClose: () => void;
    onCollect?: () => void;
}

export default function WatchAdModal({visible, onClose, onCollect}: WatchAdModalProps) {
    const {t} = useTranslation();
    const [limitReached, setLimitReached] = useState(false);
    const [watchedTimes, setWatchedTimes] = useState<string[]>([]);
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        if (!visible) return;

        loadTodayData().then(data => {
            setWatchedTimes(data.times);
            setLimitReached(data.times.length >= MAX_DAILY);
        });

        scaleAnim.setValue(0.85);
        Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 55, useNativeDriver: true}).start();
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                {limitReached ? (
                    <>
                        <Text allowFontScaling={false} style={styles.limitEmoji}>⏰</Text>
                        <Text allowFontScaling={false} style={styles.limitTitle}>{t('adLimitTitle')}</Text>
                        <Text allowFontScaling={false} style={styles.limitSub}>{t('adLimitSub')}</Text>

                        <View style={styles.timesCard}>
                            {watchedTimes.map((time, i) => (
                                <View key={i} style={styles.timeRow}>
                                    <Text allowFontScaling={false} style={styles.timeIndex}>{i + 1}.</Text>
                                    <Text allowFontScaling={false} style={styles.timeLabel}>{t('adWatchedAt')}</Text>
                                    <Text allowFontScaling={false} style={styles.timeValue}>{time}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.8}
                            style={styles.closeBtnFull}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t('close')}
                        >
                            <Text allowFontScaling={false} style={styles.closeBtnFullText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text allowFontScaling={false} style={styles.confirmEmoji}>📺</Text>
                        <Text allowFontScaling={false} style={styles.confirmTitle}>{t('watchAdQuestion')}</Text>

                        <View style={styles.remainingBadge}>
                            <Text allowFontScaling={false} style={styles.remainingText}>
                                {MAX_DAILY - watchedTimes.length}/{MAX_DAILY}
                            </Text>
                        </View>

                        <View style={styles.confirmReward}>
                            <Coin width={22} height={20}/>
                            <Text allowFontScaling={false} style={styles.confirmRewardText}>+10</Text>
                        </View>

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                onPress={onClose}
                                activeOpacity={0.75}
                                style={styles.noBtn}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('cancel')}
                            >
                                <Text allowFontScaling={false} style={styles.noBtnText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    const data = await loadTodayData();
                                    await saveWatch(data);
                                    onCollect?.();
                                    onClose();
                                }}
                                activeOpacity={0.85}
                                style={styles.yesWrap}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('watchAd')}
                            >
                                <LinearGradient
                                    colors={['#f7971e', '#ffd200']}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                    style={styles.yesBtn}
                                >
                                    <Text allowFontScaling={false} style={styles.yesBtnText}>{t('watchAd')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
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
    limitEmoji: {fontSize: ms(52), marginBottom: vs(10)},
    limitTitle: {color: WHITE, fontSize: ms(18), fontWeight: '800', textAlign: 'center', marginBottom: vs(6)},
    limitSub: {color: WHITE_100, fontSize: ms(13), textAlign: 'center', opacity: 0.7, marginBottom: vs(16)},
    timesCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: ms(16),
        paddingVertical: vs(12),
        paddingHorizontal: ms(16),
        marginBottom: vs(18),
        gap: vs(8),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    timeRow: {flexDirection: 'row', alignItems: 'center', gap: ms(6)},
    timeIndex: {color: 'rgba(255,255,255,0.4)', fontSize: ms(13), fontWeight: '600', width: ms(16)},
    timeLabel: {color: WHITE_100, fontSize: ms(13), opacity: 0.7, flex: 1},
    timeValue: {color: GOLD, fontSize: ms(15), fontWeight: '800'},
    closeBtnFull: {
        width: '100%', paddingVertical: vs(14), alignItems: 'center',
        borderRadius: ms(16), borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    },
    closeBtnFullText: {color: WHITE_100, fontSize: ms(15), fontWeight: '600'},
    confirmEmoji: {fontSize: ms(52), marginBottom: vs(10)},
    confirmTitle: {color: WHITE, fontSize: ms(15), fontWeight: '700', textAlign: 'center', marginBottom: vs(10), lineHeight: ms(22)},
    remainingBadge: {
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderRadius: ms(20),
        paddingHorizontal: ms(12),
        paddingVertical: vs(4),
        marginBottom: vs(14),
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    remainingText: {color: GOLD, fontSize: ms(13), fontWeight: '700'},
    confirmReward: {flexDirection: 'row', alignItems: 'center', gap: ms(8), marginBottom: vs(20)},
    confirmRewardText: {color: GOLD, fontSize: ms(26), fontWeight: '900'},
    confirmActions: {flexDirection: 'row', width: '100%', gap: ms(12)},
    noBtn: {
        flex: 1, paddingVertical: vs(14), borderRadius: ms(16),
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
    },
    noBtnText: {color: WHITE_100, fontSize: ms(15), fontWeight: '600'},
    yesWrap: {flex: 2, borderRadius: ms(16), overflow: 'hidden', shadowColor: GOLD, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8},
    yesBtn: {paddingVertical: vs(14), alignItems: 'center', borderRadius: ms(16)},
    yesBtnText: {color: DARK_PURPLE, fontSize: ms(15), fontWeight: '900'},
});
