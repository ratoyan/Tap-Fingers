import React, {useEffect, useRef} from "react";
import LinearGradient from "react-native-linear-gradient";
import {Animated, Image, Text, View} from "react-native";
import {useTranslation} from "react-i18next";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ProgressItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT} from "../../../constants/colors.ts";

interface ProgressItemProps {
    item: any,
    trophy: any
}

function ProgressItem({item, trophy}: ProgressItemProps) {
    const {t} = useTranslation();

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: item.progress,
            duration: 700,
            delay: 200,
            useNativeDriver: false,
        }).start();
    }, [item.progress]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const levelText = trophy
        ? `${trophy} ${t('level')} ${item.level}`
        : `${t('level')} ${item.level}`;

    const progressPercent = Math.round(item.progress * 100);

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
            <Image
                source={{uri: item.avatar}}
                style={styles.avatar}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`${t('avatar')}`}
            />

            <View style={styles.info} importantForAccessibility="no-hide-descendants">
                {/* Level row */}
                <View style={styles.levelRow}>
                    <Text style={styles.level}>{levelText}</Text>
                    <View style={styles.scoreRow}>
                        <Text style={styles.score}>{item.score}</Text>
                        <Coin width={18} height={18}/>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressWrapper}>
                    <View style={styles.progressBarBackground}>
                        <Animated.View style={[styles.progressBarFill, {width: progressWidth}]}/>
                    </View>
                    <Text style={styles.progressLabel}>{progressPercent}%</Text>
                </View>
            </View>
        </LinearGradient>
    );
}

export default ProgressItem;
