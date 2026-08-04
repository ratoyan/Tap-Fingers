import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import {useNoticeStore, NoticeType} from '../../../store/noticeStore.ts';
import styles from './NoticeModal.style.ts';

interface Palette {
    gradient: [string, string, string];
    border: string;
    glow: string;            // solid accent used for the card / icon glow shadow
    iconBg: string;
    iconBorder: string;
    titleColor: string;
    titleGlow: string;
    divider: string;
    buttonGradient: [string, string];
    emoji: string;
    defaultTitle: string;
}

const PALETTES: Record<NoticeType, Palette> = {
    success: {
        gradient: ['#0c2a1a', '#0a1f1c', '#0d2a22'],
        border: 'rgba(127, 255, 127, 0.45)',
        glow: '#25ae88',
        iconBg: 'rgba(37, 174, 136, 0.18)',
        iconBorder: 'rgba(127, 255, 127, 0.55)',
        titleColor: '#7FFF7F',
        titleGlow: 'rgba(37, 174, 136, 0.85)',
        divider: 'rgba(127, 255, 127, 0.55)',
        buttonGradient: ['#25ae88', '#0f8a66'],
        emoji: '🎉',
        defaultTitle: 'Success',
    },
    error: {
        gradient: ['#3a0a18', '#26050f', '#3a0a18'],
        border: 'rgba(255, 105, 140, 0.45)',
        glow: '#ff4d6d',
        iconBg: 'rgba(255, 70, 90, 0.18)',
        iconBorder: 'rgba(255, 105, 140, 0.55)',
        titleColor: '#FF8FA8',
        titleGlow: 'rgba(255, 70, 90, 0.85)',
        divider: 'rgba(255, 105, 140, 0.55)',
        buttonGradient: ['#ff4d6d', '#c9184a'],
        emoji: '⚠️',
        defaultTitle: 'Oops',
    },
    info: {
        gradient: ['#1e0040', '#0d0020', '#1a0038'],
        border: 'rgba(218, 112, 214, 0.45)',
        glow: '#8e2de2',
        iconBg: 'rgba(142, 45, 226, 0.18)',
        iconBorder: 'rgba(218, 112, 214, 0.55)',
        titleColor: '#DA70D6',
        titleGlow: 'rgba(255, 0, 255, 0.85)',
        divider: 'rgba(218, 112, 214, 0.55)',
        buttonGradient: ['#8e2de2', '#4a00e0'],
        emoji: 'ℹ️',
        defaultTitle: 'Notice',
    },
};

export default function NoticeModal() {
    const {t} = useTranslation();
    const visible = useNoticeStore(s => s.visible);
    const type = useNoticeStore(s => s.type);
    const title = useNoticeStore(s => s.title);
    const message = useNoticeStore(s => s.message);
    const confirmLabel = useNoticeStore(s => s.confirmLabel);
    const autoHideMs = useNoticeStore(s => s.autoHideMs);
    const hide = useNoticeStore(s => s.hide);

    const scaleAnim = useRef(new Animated.Value(0.7)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const shineAnim = useRef(new Animated.Value(-1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
    const shineRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {toValue: 1, friction: 6, tension: 80, useNativeDriver: true}),
                Animated.timing(opacityAnim, {toValue: 1, duration: 220, useNativeDriver: true}),
            ]).start();

            shineAnim.setValue(-1);
            shineRef.current = Animated.loop(
                Animated.timing(shineAnim, {
                    toValue: 2,
                    duration: 2400,
                    delay: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            );
            shineRef.current.start();

            pulseRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {toValue: 1.08, duration: 650, useNativeDriver: true}),
                    Animated.timing(pulseAnim, {toValue: 1, duration: 650, useNativeDriver: true}),
                ]),
            );
            pulseRef.current.start();

            if (autoHideMs && autoHideMs > 0) {
                const id = setTimeout(() => hide(), autoHideMs);
                return () => clearTimeout(id);
            }
        } else {
            scaleAnim.setValue(0.7);
            opacityAnim.setValue(0);
            pulseRef.current?.stop();
            shineRef.current?.stop();
            pulseAnim.setValue(1);
        }
    }, [visible, autoHideMs]);

    const palette = PALETTES[type];
    const shineTranslate = shineAnim.interpolate({inputRange: [-1, 2], outputRange: [-320, 320]});
    const headline = title || palette.defaultTitle;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={hide}>
            <Pressable style={styles.backdrop} onPress={hide}>
                <Animated.View style={[styles.backdrop, {opacity: opacityAnim, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}]} />
                <Pressable style={styles.cardPress} onPressIn={() => {}}>
                    <Animated.View
                        style={[
                            styles.cardWrapper,
                            {shadowColor: palette.glow, transform: [{scale: scaleAnim}], opacity: opacityAnim},
                        ]}
                    >
                        <View style={[styles.card, {borderColor: palette.border}]}>
                            <LinearGradient
                                colors={palette.gradient}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={StyleSheet.absoluteFill}
                            />
                            {/* Glossy top sheen for depth */}
                            <LinearGradient
                                pointerEvents="none"
                                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                                style={styles.sheen}
                            />

                            <Animated.View
                                pointerEvents="none"
                                style={[styles.shine, {transform: [{translateX: shineTranslate}, {skewX: '-20deg'}]}]}
                            />

                            {/* Close button */}
                            <TouchableOpacity
                                onPress={hide}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                style={styles.closeBtn}
                                accessibilityRole="button"
                                accessibilityLabel={t('closeLabel')}
                            >
                                <Text allowFontScaling={false} style={styles.closeText}>✕</Text>
                            </TouchableOpacity>

                            {/* Icon with a soft halo behind it */}
                            <View style={styles.iconWrap}>
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.iconHalo,
                                        {borderColor: palette.iconBorder, transform: [{scale: pulseAnim}]},
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.iconRing,
                                        {backgroundColor: palette.iconBg, borderColor: palette.iconBorder, shadowColor: palette.glow},
                                    ]}
                                >
                                    <Text allowFontScaling={false} style={styles.iconEmoji}>
                                        {palette.emoji}
                                    </Text>
                                </View>
                            </View>

                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.title,
                                    {color: palette.titleColor, textShadowColor: palette.titleGlow},
                                ]}
                                accessibilityRole="header"
                            >
                                {headline}
                            </Text>

                            {message ? (
                                <>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0)', palette.divider, 'rgba(255,255,255,0)']}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 0}}
                                        style={styles.divider}
                                    />
                                    <Text allowFontScaling={false} style={styles.message}>
                                        {message}
                                    </Text>
                                </>
                            ) : (
                                <View style={{height: 12}} />
                            )}

                            <TouchableOpacity
                                onPress={hide}
                                activeOpacity={0.85}
                                style={[styles.button, {shadowColor: palette.glow}]}
                                accessibilityRole="button"
                                accessibilityLabel={confirmLabel}
                            >
                                <LinearGradient
                                    colors={palette.buttonGradient}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.buttonGradient}
                                >
                                    <Text allowFontScaling={false} style={styles.buttonText}>
                                        {confirmLabel}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
