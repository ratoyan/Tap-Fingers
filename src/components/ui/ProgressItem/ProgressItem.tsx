import React, {useEffect, useRef} from "react";
import LinearGradient from "react-native-linear-gradient";
import {Animated, Image, Text, View} from "react-native";
import {useTranslation} from "react-i18next";

// icons
import Coin from "../../../assets/icons/Coin.tsx";
import UserIcon from "../../../assets/icons/UserIcon.tsx";

// store
import {useConfigStore} from "../../../store/configStore.ts";

// styles
import styles from './ProgressItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT} from "../../../constants/colors.ts";

interface ProgressItemProps {
    item: any,
    trophy: any,
    // Highest level reached across the leaderboard — used as the ceiling for
    // the progress-bar denominator (levelLength × topLevel). Defaults to this
    // entry's own level so the bar still renders if the parent forgets to pass it.
    topLevel?: number,
}

function ProgressItem({item, trophy, topLevel}: ProgressItemProps) {
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
    const levelText = trophy ? `${trophy} ${primaryText}` : primaryText;

    const progressPercent = Math.round(progress * 100);

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
                <View
                    style={[styles.avatar, {alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)'}]}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={`${t('avatar')}`}
                >
                    <UserIcon size={28} color="#fff"/>
                </View>
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
