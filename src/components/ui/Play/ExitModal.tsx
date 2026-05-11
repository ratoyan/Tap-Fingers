import React, {useEffect, useRef} from "react";
import {View, Text, TouchableOpacity, Animated} from "react-native";
import {useTranslation} from "react-i18next";
import LinearGradient from "react-native-linear-gradient";

// styles
import styles from './Play.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, WHITE} from "../../../constants/colors.ts";

interface ExitModalProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ExitModal({visible, onConfirm, onCancel}: ExitModalProps) {
    const {t} = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0);
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.loseOverlay}>
            <Animated.View style={[styles.loseModal, {transform: [{scale: scaleAnim}]}]}>
                <Text allowFontScaling={false} style={{fontSize: 44, marginBottom: 6}}>🚪</Text>
                <Text allowFontScaling={false} style={[styles.loseTitle, {color: WHITE}]}>{t('exitGame')}</Text>
                <Text allowFontScaling={false} style={styles.loseText}>{t('exitGameDescription')}</Text>
                <View style={styles.loseModalActions}>
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.8}
                        style={styles.loseModalBackAction}
                    >
                        <Text allowFontScaling={false} style={{color: WHITE, fontSize: 16}}>{t('yes')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCancel} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.loseRetry}
                        >
                            <Text allowFontScaling={false} style={styles.loseBtnText}>{t('no')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}
