import React from "react";
import {Text} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTranslation} from "react-i18next";

// styles
import styles from './Play.style.ts';
import {GRADIENT_LIGHT, PURPLE_DARK} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";

interface LevelProps {
    level?: number;
}

function Level({level = 1}: LevelProps) {
    const insets = useSafeAreaInsets();
    const {t} = useTranslation();

    return (
        <LinearGradient
            colors={[PURPLE_DARK, GRADIENT_LIGHT]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.levelContainer, {top: insets.top + TOP_OFFSET + 30}]}
        >
            <Text allowFontScaling={false} style={styles.levelIcon}>⚡</Text>
            <Text allowFontScaling={false} style={styles.levelLabel}>{t('lvlShort')}</Text>
            <Text allowFontScaling={false} style={styles.level}>{level}</Text>
        </LinearGradient>
    );
}

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(Level);
