import React, {useEffect, useRef} from "react";
import LinearGradient from "react-native-linear-gradient";
import {Animated, Image, Text, View} from "react-native";
import {useTranslation} from "react-i18next";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// store
import {useConfigStore} from "../../../store/configStore.ts";

// data
import {avatarForId} from "../../../data/avatars.ts";

// styles
import styles from './ProgressItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT} from "../../../constants/colors.ts";

interface ProgressItemProps {
    item: any,
    trophy: any,
    // Zero-based position in the leaderboard list; rendered as a 1-based rank.
    index?: number,
    // Highest level reached across the leaderboard — used as the ceiling for
    // the progress-bar denominator (levelLength × topLevel). Defaults to this
    // entry's own level so the bar still renders if the parent forgets to pass it.
    topLevel?: number,
}

function ProgressItem({item, trophy, index, topLevel}: ProgressItemProps) {
    const {t} = useTranslation();
    const levelLength = useConfigStore(s => s.levelLength);

    const ceilingLevel = Math.max(1, topLevel ?? item.level ?? 1);
    const progress = Math.min(1, (item.score ?? 0) / Math.max(1, levelLength * ceilingLevel));

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 700,
            delay: 200,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // Leaderboard entries carry a username; fall back to the level label
    // for any caller that still passes the legacy shape.
    const primaryText = item.username
        ? `${item.username}`
        : `${t('level')} ${item.level}`;
    // The top 3 show a medal instead of a number; rank 4+ (index ≥ 3) gets the
    // numeric 1-based rank prefix.
    const rankPrefix = typeof index === 'number' && index >= 3 ? `${index + 1}. ` : '';
    const trophyPrefix = trophy ? `${trophy} ` : '';
    const levelText = `${rankPrefix}${trophyPrefix}${primaryText}`;

    const progressPercent = Math.round(progress * 100);

    // Same deterministic avatar the Profile screen shows (emoji on a gradient,
    // keyed by the player's id) — so each row wears that player's own icon.
    const avatar = avatarForId(item.playerId);

    return (
        <LinearGradient
            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.progressItem}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`${levelText}. ${t('score')} ${item.score}. ${t('progress')} ${progressPercent}%`}
        >
            {item.avatar ? (
                <Image
                    source={{uri: item.avatar}}
                    style={styles.avatar}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={`${t('avatar')}`}
                />
            ) : (
                <LinearGradient
                    colors={avatar.colors}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.avatar, styles.avatarFallback]}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={`${t('avatar')}`}
                >
                    <Text allowFontScaling={false} style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </LinearGradient>
            )}

            <View style={styles.info} importantForAccessibility="no-hide-descendants">
                {/* Level row */}
                <View style={styles.levelRow}>
                    <Text allowFontScaling={false} style={styles.level}>{levelText}</Text>
                    <View style={styles.scoreRow}>
                        <Text allowFontScaling={false} style={styles.score}>{item.score}</Text>
                        <Coin width={18} height={18}/>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressWrapper}>
                    <View style={styles.progressBarBackground}>
                        <Animated.View style={[styles.progressBarFill, {width: progressWidth}]}/>
                    </View>
                    <Text allowFontScaling={false} style={styles.progressLabel}>{progressPercent}%</Text>
                </View>
            </View>
        </LinearGradient>
    );
}

export default ProgressItem;
