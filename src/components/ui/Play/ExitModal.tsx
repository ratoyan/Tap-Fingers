import React, {useEffect, useRef, useState} from "react";
import {View, Text, TouchableOpacity, Animated, Easing} from "react-native";
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

function ExitModal({visible, onConfirm, onCancel}: ExitModalProps) {
    const {t} = useTranslation();

    // Keep mounted while the exit animation plays.
    const [rendered, setRendered] = useState(visible);

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const glow = useRef(new Animated.Value(0)).current;

    // Continuous soft pulse on the icon halo.
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(glow, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glow, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [glow]);

    useEffect(() => {
        if (visible) {
            setRendered(true);
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {toValue: 1, friction: 7, tension: 70, useNativeDriver: true}),
                Animated.timing(cardOpacity, {toValue: 1, duration: 220, useNativeDriver: true}),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.85,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {toValue: 0, duration: 180, useNativeDriver: true}),
            ]).start(({finished}) => {
                if (finished) setRendered(false);
            });
        }
    }, [visible]);

    if (!rendered) return null;

    const haloScale = glow.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]});
    const haloOpacity = glow.interpolate({inputRange: [0, 1], outputRange: [0.45, 0]});

    return (
        <Animated.View style={[styles.exitOverlay, {opacity: overlayOpacity}]}>
            <Animated.View
                style={styles.exitOverlayTouchable}
                onStartShouldSetResponder={() => true}
                onResponderRelease={onCancel}
            />
            <Animated.View style={[styles.exitCard, {opacity: cardOpacity, transform: [{scale: scaleAnim}]}]}>

                {/* Glowing door badge */}
                <View style={styles.exitIconWrap}>
                    <Animated.View
                        style={[styles.exitIconHalo, {opacity: haloOpacity, transform: [{scale: haloScale}]}]}
                    />
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.exitIconBadge}
                    >
                        <Text allowFontScaling={false} style={styles.exitIconEmoji}>🚪</Text>
                    </LinearGradient>
                </View>

                <Text allowFontScaling={false} style={styles.exitTitle} accessibilityRole="header">
                    {t('exitGame')}
                </Text>
                <Text allowFontScaling={false} style={styles.exitText}>
                    {t('exitGameDescription')}
                </Text>

                <View style={styles.exitActions}>
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.8}
                        style={styles.exitCancelBtn}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('yes')}
                    >
                        <Text allowFontScaling={false} style={styles.exitCancelText}>{t('yes')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onCancel}
                        activeOpacity={0.85}
                        style={styles.exitConfirmTouchable}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('no')}
                    >
                        <LinearGradient
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.exitConfirmBtn}
                        >
                            <Text allowFontScaling={false} style={styles.exitConfirmText}>{t('no')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(ExitModal);
