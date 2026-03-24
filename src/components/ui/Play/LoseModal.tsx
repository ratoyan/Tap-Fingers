import React, {useEffect, useRef} from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing
} from "react-native";
import {useTranslation} from "react-i18next";

// styles
import styles from './Play.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, WHITE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface LoseModalProps {
    visible: boolean;
    onRetry: () => void;
}

export default function LoseModal({visible, onRetry}: LoseModalProps) {

    const {t} = useTranslation();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {

        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
        }).start();

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
        <View style={styles.loseOverlay}>

            <Animated.View
                style={[
                    styles.loseModal,
                    {transform: [{scale: scaleAnim}]}
                ]}
            >
                <Text style={{color: WHITE, fontSize: 32}}>😞 😢 😭</Text>


                <Animated.Text
                    style={[
                        styles.loseTitle,
                        {color: headerGlow}
                    ]}
                >
                    {t('gameOver')}
                </Animated.Text>

                <Text style={styles.loseText}>
                    {t('lostLevel')}
                </Text>

                <TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.loseRetry}
                    >
                        <Text style={styles.loseBtnText}>{t('retry')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </Animated.View>

        </View>
    );
}