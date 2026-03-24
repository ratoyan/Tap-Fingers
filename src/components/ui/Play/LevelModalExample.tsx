import React, {useEffect, useRef} from "react";
import {Modal, View, Text, TouchableOpacity, Animated, Easing} from "react-native";
import {useTranslation} from "react-i18next";

// styles
import styles from './Play.style.ts'
import {GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, PURPLE_LIGHT, WHITE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface LevelModalGamingProps {
    visible: boolean,
    setVisible: (val: boolean) => void,
    level: number
}

export default function LevelModalGaming({visible, setVisible, level = 1}: LevelModalGamingProps) {

    const {t} = useTranslation();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pop-in animation
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
        }).start();

        // Glowing pulsating animation for header
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const headerGlow = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [PURPLE, GRADIENT_LIGHT]
    });

    if (!visible) return null;

    return (
        <View style={styles.modalBackground}>
            <Animated.View style={[styles.modalContainer, {transform: [{scale: scaleAnim}]}]}>
                <View style={styles.confettiPlaceholder}>
                    <Text style={{color: WHITE, fontSize: 32}}>🎉✨🎊</Text>
                </View>

                <Animated.View style={[styles.levelHeader, {backgroundColor: headerGlow}]}>
                    <Text style={styles.levelText}>{t('level')} {level}</Text>
                </Animated.View>

                <Text style={styles.messageText}>{t('leveledUp')}</Text>

                <TouchableOpacity style={styles.continueButton} onPress={() => setVisible(false)}>
                    <LinearGradient
                        colors={[PURPLE_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>{t('continue')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
