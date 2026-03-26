import React from "react";
import {Text} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {GRADIENT_LIGHT, PURPLE_DARK} from "../../../constants/colors.ts";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// styles
import styles from './Play.style.ts';

interface LevelProps {
    level?: number;
}

function Level({level = 1}: LevelProps) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[PURPLE_DARK, GRADIENT_LIGHT]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.levelContainer, {top: insets.top + 30}]}
        >
            <Text style={styles.levelIcon}>⚡</Text>
            <Text style={styles.levelLabel}>LVL</Text>
            <Text style={styles.level}>{level}</Text>
        </LinearGradient>
    );
}

export default Level;
