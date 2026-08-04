import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {languages} from '../../../data/language.ts';
import {useTranslation} from 'react-i18next';
import {GRADIENT_DARK, GRADIENT_LIGHT} from '../../../constants/colors.ts';
import {vs} from '../../../utils/responsive.ts';
import styles from './LanguageModal.style';

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (val: any) => void;
    selectedLanguage?: string;
}

function LanguageModal({visible, onClose, onSelect, selectedLanguage}: LanguageModalProps) {
    const {t} = useTranslation();

    // Keep mounted while the exit animation plays.
    const [rendered, setRendered] = useState(visible);

    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const glow = useRef(new Animated.Value(0)).current;

    // Per-item entrance values (slide up + fade), animated in a stagger.
    const itemAnims = useRef(languages.map(() => new Animated.Value(0))).current;

    // Continuous soft pulse on the globe halo. Gated on `rendered`, not started
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
            itemAnims.forEach(a => a.setValue(0));
            Animated.parallel([
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {toValue: 1, friction: 7, tension: 70, useNativeDriver: true}),
                Animated.timing(fadeAnim, {toValue: 1, duration: 220, useNativeDriver: true}),
                Animated.stagger(
                    70,
                    itemAnims.map(a =>
                        Animated.spring(a, {toValue: 1, friction: 8, tension: 80, useNativeDriver: true}),
                    ),
                ),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayAnim, {
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
                Animated.timing(fadeAnim, {toValue: 0, duration: 180, useNativeDriver: true}),
            ]).start(({finished}) => {
                if (finished) setRendered(false);
            });
        }
    }, [visible]);

    if (!rendered) return null;

    const haloScale = glow.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]});
    const haloOpacity = glow.interpolate({inputRange: [0, 1], outputRange: [0.45, 0]});

    return (
        <Animated.View style={[styles.overlay, {opacity: overlayAnim}]}>
            <Animated.View
                style={styles.overlayTouchable}
                onStartShouldSetResponder={() => true}
                onResponderRelease={onClose}
            />
            <Animated.View style={[styles.card, {transform: [{scale: scaleAnim}], opacity: fadeAnim}]}>

                {/* Glowing globe badge */}
                <View style={styles.iconWrap}>
                    <Animated.View
                        style={[styles.iconHalo, {opacity: haloOpacity, transform: [{scale: haloScale}]}]}
                    />
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.iconBadge}
                    >
                        <Text allowFontScaling={false} style={styles.iconGlobe}>🌐</Text>
                    </LinearGradient>
                </View>

                {/* Title */}
                <Text allowFontScaling={false} style={styles.title}>
                    {t('selectLanguage')}
                </Text>

                <View style={styles.divider}/>

                {/* Language items */}
                {languages.map((lang, index) => {
                    const meta = {flag: lang.flag || '🌍', native: lang.native || lang.name};
                    const isSelected = selectedLanguage === lang.name;
                    const anim = itemAnims[index];
                    const translateY = anim.interpolate({inputRange: [0, 1], outputRange: [vs(16), 0]});

                    return (
                        <Animated.View
                            key={lang.code}
                            style={[
                                styles.itemAnimWrap,
                                index === languages.length - 1 && {marginBottom: 0},
                                {opacity: anim, transform: [{translateY}]},
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.item}
                                onPressIn={() => { onSelect(lang); onClose(); }}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityState={{selected: isSelected}}
                                accessibilityLabel={lang.name}
                            >
                                {isSelected ? (
                                    <View style={styles.itemInner}>
                                        <LinearGradient
                                            colors={['rgba(142,45,226,0.5)', 'rgba(74,0,224,0.4)']}
                                            start={{x: 0, y: 0}}
                                            end={{x: 1, y: 0}}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text allowFontScaling={false} style={styles.flag}>{meta.flag}</Text>
                                        <View style={styles.labelCol}>
                                            <Text allowFontScaling={false} style={[styles.nativeName, styles.nativeNameSelected]}>
                                                {meta.native}
                                            </Text>
                                            <Text allowFontScaling={false} style={[styles.engName, styles.engNameSelected]}>
                                                {lang.name}
                                            </Text>
                                        </View>
                                        <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                                    </View>
                                ) : (
                                    <View style={styles.itemInner}>
                                        <Text allowFontScaling={false} style={styles.flag}>{meta.flag}</Text>
                                        <View style={styles.labelCol}>
                                            <Text allowFontScaling={false} style={styles.nativeName}>{meta.native}</Text>
                                            <Text allowFontScaling={false} style={styles.engName}>{lang.name}</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

            </Animated.View>
        </Animated.View>
    );
}

export default LanguageModal;
