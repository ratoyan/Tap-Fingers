import React, {useEffect, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    ScrollView,
    StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ms, vs} from '../../../utils/responsive.ts';
import {
    BLUISH_PURPLE,
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
import Coin from '../../../assets/icons/Coin.tsx';

interface HelpModalProps {
    visible: boolean;
    onClose: () => void;
}

const RULES = [
    {icon: '🎯', title: 'Tap Cards',       desc: 'Tap the falling cards before they hit the ground.'},
    {icon: '⭐', title: 'Golden Cards',     desc: 'Golden cards give 3× points — tap them fast!'},
    {icon: '⚡', title: 'Combo',            desc: 'Tap multiple cards quickly to build a combo streak.'},
    {icon: '💔', title: 'Lives',            desc: 'You have 7 lives. A missed card costs one life.'},
    {icon: '💣', title: 'Bomb',             desc: 'Clears all visible cards and scores the points.'},
    {icon: '🛡️', title: 'Shield',          desc: 'Absorbs one missed card without losing a life.'},
    {icon: '⏱️', title: 'Slow Mo',         desc: 'Slows all cards for 8 seconds — use wisely!'},
    {icon: '🏆', title: 'Level Up',        desc: 'Score 30 points per level. Speed increases each level.'},
];

export default function HelpModal({visible, onClose}: HelpModalProps) {
    const scaleAnim  = useRef(new Animated.Value(0)).current;
    const fadeAnim   = useRef(new Animated.Value(0)).current;
    const glowAnim   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) return;
        scaleAnim.setValue(0.85);
        fadeAnim.setValue(0);
        glowAnim.setValue(0);

        Animated.parallel([
            Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 55, useNativeDriver: true}),
            Animated.timing(fadeAnim,  {toValue: 1, duration: 250, useNativeDriver: true}),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {toValue: 1, duration: 1200, useNativeDriver: false}),
                Animated.timing(glowAnim, {toValue: 0, duration: 1200, useNativeDriver: false}),
            ])
        ).start();
    }, [visible]);

    if (!visible) return null;

    const glowColor = glowAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: [ORCHID, PURPLE_LIGHT],
    });

    return (
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                {/* Header */}
                <LinearGradient
                    colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.header}
                >
                    <Text style={styles.headerEmoji}>📖</Text>
                    <View>
                        <Text style={styles.headerTitle}>HOW TO PLAY</Text>
                        <Text style={styles.headerSub}>Game guide</Text>
                    </View>
                </LinearGradient>

                {/* Rules list */}
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {RULES.map((rule, i) => (
                        <View key={i} style={styles.ruleRow}>
                            <View style={styles.ruleIconWrap}>
                                <Text style={styles.ruleIcon}>{rule.icon}</Text>
                            </View>
                            <View style={styles.ruleTextWrap}>
                                <Text style={styles.ruleTitle}>{rule.title}</Text>
                                <Text style={styles.ruleDesc}>{rule.desc}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Divider */}
                <View style={styles.divider}/>

                {/* Cost notice */}
                <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Cost per view</Text>
                    <View style={styles.costBadge}>
                        <Coin width={16} height={16}/>
                        <Text style={styles.costValue}>5</Text>
                    </View>
                </View>

                {/* Close button */}
                <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.closeWrap}>
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.closeBtn}
                    >
                        <Text style={styles.closeBtnText}>Got it! ✓</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '88%',
        maxHeight: '82%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(28),
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.3)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 30,
        elevation: 22,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(14),
        paddingVertical: vs(16),
        paddingHorizontal: ms(20),
    },
    headerEmoji: {
        fontSize: ms(36),
    },
    headerTitle: {
        color: WHITE,
        fontSize: ms(20),
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(12),
        fontWeight: '500',
        letterSpacing: 1,
    },
    scroll: {
        maxHeight: vs(340),
    },
    scrollContent: {
        paddingHorizontal: ms(16),
        paddingTop: vs(12),
        paddingBottom: vs(4),
        gap: vs(4),
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(12),
        paddingVertical: vs(10),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    ruleIconWrap: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(14),
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleIcon: {
        fontSize: ms(22),
    },
    ruleTextWrap: {
        flex: 1,
    },
    ruleTitle: {
        color: PLUM,
        fontSize: ms(13),
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: vs(2),
    },
    ruleDesc: {
        color: WHITE_100,
        fontSize: ms(12),
        lineHeight: ms(17),
        opacity: 0.85,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: ms(16),
        marginTop: vs(10),
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ms(20),
        paddingVertical: vs(10),
    },
    costLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        fontWeight: '600',
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(4),
        backgroundColor: 'rgba(255,215,0,0.15)',
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
        borderRadius: ms(20),
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    costValue: {
        color: GOLD,
        fontSize: ms(13),
        fontWeight: '800',
    },
    closeWrap: {
        marginHorizontal: ms(16),
        marginBottom: vs(16),
        borderRadius: ms(16),
        overflow: 'hidden',
    },
    closeBtn: {
        paddingVertical: vs(14),
        alignItems: 'center',
        borderRadius: ms(16),
    },
    closeBtnText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '800',
        letterSpacing: 1,
    },
});
