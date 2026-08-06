import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, Animated, Easing} from 'react-native';
import {useTranslation} from "react-i18next";
import LinearGradient from 'react-native-linear-gradient';

// icons
import ExitIcon from '../../../assets/icons/ExitIcon.tsx';

// constants
import {GRADIENT_DARK, GRADIENT_LIGHT, WHITE} from '../../../constants/colors.ts';

// styles
import styles from './LogoutModal.style.ts';

export default function LogoutModal({visible, onClose, onConfirm}: any) {
    const {t} = useTranslation();

    // Keep the modal mounted while the exit animation plays.
    const [rendered, setRendered] = useState(visible);

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const modalScale = useRef(new Animated.Value(0.85)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const glow = useRef(new Animated.Value(0)).current;

    // Continuous soft pulse on the icon halo. Gated on `rendered`, not started
    // on mount: the modal returns null while closed, so an ungated loop drove a
    // value nothing was drawing — forever, for the whole time the player sat on
    // the Settings screen.
    useEffect(() => {
        if (!rendered) return;
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
    }, [glow, rendered]);

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
                Animated.spring(modalScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 70,
                    useNativeDriver: true,
                }),
                Animated.timing(modalOpacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(modalScale, {
                    toValue: 0.85,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(modalOpacity, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start(({finished}) => {
                if (finished) setRendered(false);
            });
        }
    }, [visible, overlayOpacity, modalScale, modalOpacity]);

    if (!rendered) return null;

    const haloScale = glow.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]});
    const haloOpacity = glow.interpolate({inputRange: [0, 1], outputRange: [0.45, 0]});

    return (
        <Animated.View style={[styles.overlay, {opacity: overlayOpacity}]}>
            <Animated.View
                style={styles.overlayTouchable}
                // catch taps on the backdrop to dismiss
                onStartShouldSetResponder={() => true}
                onResponderRelease={onClose}
            />
            <Animated.View
                style={[
                    styles.modalContainer,
                    {opacity: modalOpacity, transform: [{scale: modalScale}]},
                ]}
            >
                {/* Glowing icon badge */}
                <View style={styles.iconWrap}>
                    <Animated.View
                        style={[
                            styles.iconHalo,
                            {opacity: haloOpacity, transform: [{scale: haloScale}]},
                        ]}
                    />
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.iconBadge}
                    >
                        <ExitIcon size={28} color={WHITE} />
                    </LinearGradient>
                </View>

                <Text allowFontScaling={false} style={styles.title}
                      accessibilityRole="header"
                >
                    {t('exitGame')}
                </Text>
                <Text allowFontScaling={false} style={styles.message}
                      accessible={true}
                      accessibilityLabel={t('exitGameDescription')}
                >
                    {t('exitGameDescription')}
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]}
                                      onPressIn={onClose}
                                      activeOpacity={0.8}
                                      accessible={true}
                                      accessibilityRole="button"
                                      accessibilityLabel={t('cancel')}
                                      accessibilityHint={t('cancelExitHint')}
                    >
                        <Text allowFontScaling={false} style={[styles.buttonText, styles.cancelText]}
                              importantForAccessibility="no-hide-descendants"
                        >
                            {t('cancel')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmTouchable}
                                      onPressIn={onConfirm}
                                      activeOpacity={0.85}
                                      accessible={true}
                                      accessibilityRole="button"
                                      accessibilityLabel={t('yes')}
                                      accessibilityHint={t('confirmExitHint')}
                    >
                        <LinearGradient
                            pointerEvents="none"
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.confirmButton}
                        />
                        <Text allowFontScaling={false} style={[styles.buttonText, styles.confirmText]}
                              importantForAccessibility="no-hide-descendants"
                        >
                            {t('yes')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}
