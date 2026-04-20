import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ms, vs} from '../../../utils/responsive.ts';
import {
    BLUISH_PURPLE,
    GOLD,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    LILAC,
    ORANGE,
    ORANGE_RED,
    PLUM,
    PURPLE,
    PURPLE_LIGHT,
    WHITE,
    WHITE_100,
} from '../../../constants/colors.ts';
import Coin from '../../../assets/icons/Coin.tsx';

export type HelperType = 'bomb' | 'shield' | 'slow';

interface HelperConfig {
    icon: string;
    name: string;
    desc: string;
    price: number;
    gradient: [string, string];
    badgeColor: string;
}

export const HELPER_CONFIGS: Record<HelperType, HelperConfig> = {
    bomb: {
        icon: '💣',
        name: 'Bomb Booster',
        desc: 'Instantly destroys all visible cards and scores the points.',
        price: 20,
        gradient: [ORANGE, '#ee0979'],
        badgeColor: ORANGE_RED,
    },
    shield: {
        icon: '🛡️',
        name: 'Shield',
        desc: 'Absorbs one missed card without losing a life.',
        price: 15,
        gradient: ['#0288d1', '#00b4d8'],
        badgeColor: '#0288d1',
    },
    slow: {
        icon: '⏱️',
        name: 'Slow Motion',
        desc: 'Slows down all falling cards for 8 seconds.',
        price: 10,
        gradient: ['#7b1fa2', LILAC],
        badgeColor: '#7b1fa2',
    },
};

interface BuyHelperModalProps {
    visible: boolean;
    helperType: HelperType | null;
    coins: number;
    onBuy: (type: HelperType) => void;
    onWatchAd: (type: HelperType) => void;
    onClose: () => void;
}

export default function BuyHelperModal({visible, helperType, coins, onBuy, onWatchAd, onClose}: BuyHelperModalProps) {
    const scaleAnim   = useRef(new Animated.Value(0.8)).current;
    const fadeAnim    = useRef(new Animated.Value(0)).current;
    const adPulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!visible) return;
        scaleAnim.setValue(0.8);
        fadeAnim.setValue(0);
        Animated.parallel([
            Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 60, useNativeDriver: true}),
            Animated.timing(fadeAnim,  {toValue: 1, duration: 200, useNativeDriver: true}),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(adPulseAnim, {toValue: 1.04, duration: 700, useNativeDriver: true}),
                Animated.timing(adPulseAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
            ])
        ).start();
    }, [visible]);

    if (!visible || !helperType) return null;

    const cfg       = HELPER_CONFIGS[helperType];
    const canAfford = coins >= cfg.price;

    return (
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                {/* Icon header */}
                <LinearGradient
                    colors={cfg.gradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.iconHeader}
                >
                    <Text style={styles.mainIcon}>{cfg.icon}</Text>
                </LinearGradient>

                {/* Title + desc */}
                <View style={styles.body}>
                    <Text style={styles.title}>{cfg.name}</Text>
                    <Text style={styles.desc}>{cfg.desc}</Text>

                    {/* Coin balance */}
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Your coins</Text>
                        <View style={styles.balanceBadge}>
                            <Coin width={18} height={18}/>
                            <Text style={styles.balanceValue}>{coins}</Text>
                        </View>
                    </View>

                    {/* Price row */}
                    <LinearGradient
                        colors={canAfford ? ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                        style={styles.priceCard}
                    >
                        <Text style={styles.priceLabel}>Cost</Text>
                        <View style={styles.priceRow}>
                            <Coin width={22} height={22}/>
                            <Text style={[styles.priceValue, !canAfford && styles.priceValueInsufficient]}>
                                {cfg.price}
                            </Text>
                        </View>
                        {!canAfford && (
                            <Text style={styles.insufficientText}>Not enough coins</Text>
                        )}
                    </LinearGradient>
                </View>

                {/* Watch Ad button */}
                <Animated.View style={[styles.adWrap, {transform: [{scale: adPulseAnim}]}]}>
                    <TouchableOpacity onPress={() => onWatchAd(helperType)} activeOpacity={0.82}>
                        <LinearGradient
                            colors={['#f7971e', '#ffd200']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.adBtn}
                        >
                            <Text style={styles.adIcon}>📺</Text>
                            <View>
                                <Text style={styles.adTitle}>Watch Ad</Text>
                                <Text style={styles.adSub}>Get +1 {cfg.name} for free</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Buy + Cancel */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => canAfford && onBuy(helperType)}
                        activeOpacity={canAfford ? 0.8 : 1}
                        style={[styles.buyWrap, !canAfford && {opacity: 0.4}]}
                    >
                        <LinearGradient
                            colors={canAfford ? [GRADIENT_LIGHT, GRADIENT_DARK] : ['#555', '#333']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.buyBtn}
                        >
                            <Coin width={16} height={16}/>
                            <Text style={styles.buyBtnText}>Buy  {cfg.price}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 25,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '82%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(28),
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.3)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.6,
        shadowRadius: 28,
        elevation: 22,
    },
    iconHeader: {
        alignItems: 'center',
        paddingVertical: vs(18),
    },
    mainIcon: {
        fontSize: ms(52),
    },
    body: {
        paddingHorizontal: ms(20),
        paddingTop: vs(16),
        paddingBottom: vs(8),
        gap: vs(10),
    },
    title: {
        color: WHITE,
        fontSize: ms(20),
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    desc: {
        color: WHITE_100,
        fontSize: ms(13),
        lineHeight: ms(19),
        textAlign: 'center',
        opacity: 0.8,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: vs(4),
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        fontWeight: '600',
    },
    balanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(5),
        backgroundColor: 'rgba(255,215,0,0.12)',
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
        borderRadius: ms(20),
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
    },
    balanceValue: {
        color: GOLD,
        fontSize: ms(14),
        fontWeight: '800',
    },
    priceCard: {
        borderRadius: ms(16),
        paddingVertical: vs(12),
        paddingHorizontal: ms(16),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: vs(4),
    },
    priceLabel: {
        color: PLUM,
        fontSize: ms(11),
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(6),
    },
    priceValue: {
        color: GOLD,
        fontSize: ms(30),
        fontWeight: '900',
    },
    priceValueInsufficient: {
        color: 'rgba(255,255,255,0.35)',
    },
    insufficientText: {
        color: '#ff6b6b',
        fontSize: ms(11),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    adWrap: {
        marginHorizontal: ms(16),
        marginBottom: vs(10),
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 8,
    },
    adBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(12),
        paddingVertical: vs(13),
        paddingHorizontal: ms(18),
        borderRadius: ms(16),
    },
    adIcon: {
        fontSize: ms(28),
    },
    adTitle: {
        color: '#1a0533',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    adSub: {
        color: '#3a1a00',
        fontSize: ms(11),
        fontWeight: '600',
        marginTop: vs(1),
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: ms(16),
        paddingBottom: vs(16),
        gap: ms(10),
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: vs(13),
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: PURPLE,
        alignItems: 'center',
    },
    cancelText: {
        color: WHITE_100,
        fontSize: ms(14),
        fontWeight: '600',
    },
    buyWrap: {
        flex: 2,
        borderRadius: ms(16),
        overflow: 'hidden',
    },
    buyBtn: {
        paddingVertical: vs(13),
        borderRadius: ms(16),
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: ms(6),
    },
    buyBtnText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
