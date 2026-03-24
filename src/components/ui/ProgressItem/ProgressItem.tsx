import React from "react";
import LinearGradient from "react-native-linear-gradient";
import {Image, Text, View} from "react-native";
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

    const levelText = trophy
        ? `${trophy} ${t('level')} ${item.level}`
        : `${t('level')} ${item.level}`;

    return (
        <LinearGradient
            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.progressItem}

            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`${levelText}. ${t('score')} ${item.score}. ${t('progress')} ${Math.round(item.progress * 100)}%`}
        >
            <Image source={{uri: item.avatar}}
                   style={styles.avatar}
                   accessible={true}
                   accessibilityRole="image"
                   accessibilityLabel={`${t('avatar')}`}
            />
            <View style={styles.info}
                  importantForAccessibility="no-hide-descendants"
            >
                <Text style={styles.level}>
                    {trophy ? `${trophy} ${t('level')} ${item.level}` : `${t('level')} ${item.level}`}
                </Text>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, {flex: item.progress}]}/>
                    <View style={[styles.progressBarEmpty, {flex: 1 - item.progress}]}/>
                </View>
                <View style={styles.scoreRow}>
                    <Text style={styles.score}>{item.score}</Text>
                    <Coin width={22} height={22}/>
                </View>
            </View>
        </LinearGradient>
    )
}

export default ProgressItem;