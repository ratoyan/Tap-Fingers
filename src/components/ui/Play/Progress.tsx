import React from "react";
import { View } from "react-native";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// styles
import styles from './Play.style.ts';

interface ProgressProps {
    length?: number;
    coin?: number;
}

function Progress({ length = 40, coin = 0 }: ProgressProps) {
    const progress = Math.min(coin / length, 1); // 0 → 1
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.progressBarBackground, {top: insets.top + TOP_OFFSET}]}>
            <View style={[styles.progressBarFill, { flex: progress }]} />
            <View style={[styles.progressBarEmpty, { flex: 1 - progress }]} />
        </View>
    );
}

export default Progress;