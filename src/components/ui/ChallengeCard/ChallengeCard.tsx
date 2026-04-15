import React, {useEffect, useRef} from "react";
import {Animated, Text, TouchableOpacity, View} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ChallengeCard.style.ts';
import {
    DARK_PURPLE,
    GOLD,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    MEDIUM_PURPLE,
    PURPLE_DARK,
} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface ChallengeCardProps {
    item: any;
    index?: number;
}

function ChallengeCard({item, index = 0}: ChallengeCardProps) {

    const entranceOpacity = useRef(new Animated.Value(0)).current;
    const entranceX = useRef(new Animated.Value(-30)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const collectPulse = useRef(new Animated.Value(1)).current;

    // Entrance: slide from left
    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceOpacity, {
                toValue: 1,
                duration: 350,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.timing(entranceX, {
                toValue: 0,
                duration: 350,
                delay: index * 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Animate progress bar fill
    useEffect(() => {
        if (item.locked) return;
        Animated.timing(progressAnim, {
            toValue: item.progress / 100,
            duration: 700,
            delay: index * 80 + 200,
            useNativeDriver: false,
        }).start();
    }, [item.progress]);

    // Pulse collect button when finished
    useEffect(() => {
        if (!item.finished) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(collectPulse, {toValue: 1.08, duration: 600, useNativeDriver: true}),
                Animated.timing(collectPulse, {toValue: 1, duration: 600, useNativeDriver: true}),
            ])
        ).start();
    }, [item.finished]);

    const getStatus = () => {
        if (item.locked)    return {label: '🔒 Locked',   bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)'};
        if (item.taken)     return {label: '✅ Claimed',   bg: 'rgba(50,205,50,0.2)',  color: '#7fff7f'};
        if (item.finished)  return {label: '🎁 Ready',    bg: 'rgba(255,215,0,0.2)',  color: GOLD};
        return               {label: '⚡ Active',          bg: 'rgba(142,45,226,0.3)', color: '#d4aaff'};
    };

    const getIcon = () => {
        if (item.locked)   return '🔒';
        if (item.taken)    return '✅';
        if (item.finished) return '🎁';
        return '🔥';
    };

    const status = getStatus();

    const cardColors: [string, string] = item.locked
        ? [PURPLE_DARK, DARK_PURPLE]
        : [GRADIENT_LIGHT, GRADIENT_DARK];

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: entranceOpacity,
                    transform: [{translateX: entranceX}],
                },
            ]}
        >
            <LinearGradient
                colors={cardColors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardInner}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Text style={styles.iconText}>{getIcon()}</Text>
                    </View>

                    <View style={styles.headerText}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        {item.locked
                            ? <Text style={styles.lockedSubtitle}>Complete previous challenge</Text>
                            : <Text style={styles.subtitle}>{item.progress}% completed</Text>
                        }
                    </View>

                    <View style={[styles.badge, {backgroundColor: status.bg}]}>
                        <Text style={[styles.badgeText, {color: status.color}]}>{status.label}</Text>
                    </View>
                </View>

                {/* Progress bar */}
                {!item.locked && (
                    <>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: progressWidth,
                                        backgroundColor: item.finished ? GOLD : 'rgba(255,255,255,0.85)',
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.progressLabel}>
                            <Text style={styles.progressText}>Progress</Text>
                            <Text style={styles.progressText}>{item.progress} / 100</Text>
                        </View>
                    </>
                )}

                {/* Footer */}
                {!item.locked && (
                    <View style={styles.footer}>
                        <View style={styles.rewardRow}>
                            <Coin width={18} height={16}/>
                            <Text style={styles.rewardText}>+{item.reward} coins</Text>
                        </View>

                        {item.finished && !item.taken && (
                            <Animated.View style={{transform: [{scale: collectPulse}]}}>
                                <TouchableOpacity style={styles.collectBtn} activeOpacity={0.8}>
                                    <Coin width={16} height={14}/>
                                    <Text style={styles.collectText}>Collect</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {item.taken && (
                            <View style={[styles.badge, {backgroundColor: 'rgba(50,205,50,0.15)'}]}>
                                <Text style={[styles.badgeText, {color: '#7fff7f'}]}>✓ Done</Text>
                            </View>
                        )}
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
}

export default ChallengeCard;
