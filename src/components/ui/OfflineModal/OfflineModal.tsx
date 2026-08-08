import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import {WIFI_ARC_COUNT, WifiArc, WifiBase} from '../../../assets/icons/WifiOffIcon.tsx';
import {useNetworkStore} from '../../../store/networkStore.ts';
import {probeConnection} from '../../../services/connectivity.ts';
import {playSfx} from '../../../utils/sfx.ts';
import {haptic} from '../../../utils/haptics.ts';
import {ms} from '../../../utils/responsive.ts';
import styles from './OfflineModal.style.ts';

// Raised whenever the app can't reach the backend (see store/networkStore).
// Mounted once in App.tsx, above the navigator, so it covers whichever screen
// the player happens to be on.

const ICON_SIZE = ms(74);

// How long the retry button keeps spinning at minimum. A hard offline fails in
// about a millisecond — without this the press would look like it did nothing.
const MIN_SPIN_MS = 700;

export default function OfflineModal() {
    const {t} = useTranslation();

    const online    = useNetworkStore(s => s.online);
    const dismissed = useNetworkStore(s => s.dismissed);
    const dismiss   = useNetworkStore(s => s.dismiss);

    const visible = !online && !dismissed;

    const [retrying, setRetrying] = useState(false);
    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scaleAnim   = useRef(new Animated.Value(0.7)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const shineAnim   = useRef(new Animated.Value(-1)).current;
    const haloAnim    = useRef(new Animated.Value(1)).current;
    const dotAnim     = useRef(new Animated.Value(0)).current;
    const spinAnim    = useRef(new Animated.Value(0)).current;
    // One value per signal arc — they light up from the inside out, so the mark
    // reads as "still searching" rather than as a dead icon.
    const arcAnims    = useRef(
        Array.from({length: WIFI_ARC_COUNT}, () => new Animated.Value(0)),
    ).current;

    const shineLoop = useRef<Animated.CompositeAnimation | null>(null);
    const haloLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const dotLoop   = useRef<Animated.CompositeAnimation | null>(null);
    const arcLoop   = useRef<Animated.CompositeAnimation | null>(null);
    const spinLoop  = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!visible) {
            scaleAnim.setValue(0.7);
            opacityAnim.setValue(0);
            shineLoop.current?.stop();
            haloLoop.current?.stop();
            dotLoop.current?.stop();
            arcLoop.current?.stop();
            haloAnim.setValue(1);
            arcAnims.forEach(a => a.setValue(0));
            return;
        }

        // Losing the connection is bad news, not a failure the player caused —
        // the soft "denied" pair says so without the weight of an error sound.
        playSfx('denied');
        haptic('denied');

        Animated.parallel([
            Animated.spring(scaleAnim, {toValue: 1, friction: 6, tension: 80, useNativeDriver: true}),
            Animated.timing(opacityAnim, {toValue: 1, duration: 220, useNativeDriver: true}),
        ]).start();

        shineAnim.setValue(-1);
        shineLoop.current = Animated.loop(
            Animated.timing(shineAnim, {
                toValue: 2, duration: 2400, delay: 500,
                easing: Easing.inOut(Easing.ease), useNativeDriver: true,
            }),
        );
        shineLoop.current.start();

        haloLoop.current = Animated.loop(Animated.sequence([
            Animated.timing(haloAnim, {toValue: 1.09, duration: 700, useNativeDriver: true}),
            Animated.timing(haloAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
        ]));
        haloLoop.current.start();

        dotLoop.current = Animated.loop(Animated.sequence([
            Animated.timing(dotAnim, {toValue: 1, duration: 620, useNativeDriver: true}),
            Animated.timing(dotAnim, {toValue: 0, duration: 620, useNativeDriver: true}),
        ]));
        dotLoop.current.start();

        // Inside-out sweep: each arc brightens a beat after the one below it.
        arcLoop.current = Animated.loop(
            Animated.stagger(210, arcAnims.map(a => Animated.sequence([
                Animated.timing(a, {toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true}),
                Animated.timing(a, {toValue: 0, duration: 640, easing: Easing.in(Easing.quad),  useNativeDriver: true}),
            ]))),
        );
        arcLoop.current.start();
        // Everything past `visible` is a useRef value and so never changes
        // identity — listed only to keep the exhaustive-deps rule quiet.
    }, [visible, arcAnims, dotAnim, haloAnim, opacityAnim, scaleAnim, shineAnim]);

    // Retry spinner, only while a probe the player asked for is in flight.
    useEffect(() => {
        spinLoop.current?.stop();
        if (!retrying) {
            spinAnim.setValue(0);
            return;
        }
        spinAnim.setValue(0);
        spinLoop.current = Animated.loop(
            Animated.timing(spinAnim, {toValue: 1, duration: 750, easing: Easing.linear, useNativeDriver: true}),
        );
        spinLoop.current.start();
    }, [retrying, spinAnim]);

    useEffect(() => () => {
        if (retryTimer.current) clearTimeout(retryTimer.current);
    }, []);

    const onRetry = useCallback(async () => {
        if (retrying) return;
        haptic('equip');
        setRetrying(true);
        const startedAt = Date.now();
        await probeConnection();
        const left = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt));
        retryTimer.current = setTimeout(() => setRetrying(false), left);
    }, [retrying]);

    const shineTranslate = shineAnim.interpolate({inputRange: [-1, 2], outputRange: [-320, 320]});
    const spinRotate     = spinAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const dotOpacity     = dotAnim.interpolate({inputRange: [0, 1], outputRange: [0.25, 1]});

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <View style={styles.backdrop}>
                <View style={styles.cardPress}>
                    <Animated.View
                        style={[styles.cardWrapper, {transform: [{scale: scaleAnim}], opacity: opacityAnim}]}
                    >
                        <View style={styles.card}>
                            <LinearGradient
                                pointerEvents="none"
                                colors={['#2b0630', '#150320', '#2a0a34']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={StyleSheet.absoluteFill}
                            />
                            <LinearGradient
                                pointerEvents="none"
                                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                                style={styles.sheen}
                            />
                            <Animated.View
                                pointerEvents="none"
                                style={[styles.shine, {transform: [{translateX: shineTranslate}, {skewX: '-20deg'}]}]}
                            />

                            {/* Signal mark: arcs sweeping under a struck-through slash. */}
                            <View style={styles.iconWrap}>
                                <Animated.View
                                    pointerEvents="none"
                                    style={[styles.iconHalo, {transform: [{scale: haloAnim}]}]}
                                />
                                <View style={styles.iconRing}>
                                    {arcAnims.map((anim, i) => (
                                        <Animated.View
                                            key={`arc-${i}`}
                                            pointerEvents="none"
                                            style={[styles.iconLayer, {
                                                opacity: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.16, 0.9],
                                                }),
                                            }]}
                                        >
                                            <WifiArc index={i} size={ICON_SIZE} color="#FFB3C4"/>
                                        </Animated.View>
                                    ))}
                                    <View pointerEvents="none" style={styles.iconLayer}>
                                        <WifiBase
                                            size={ICON_SIZE}
                                            color="#FFB3C4"
                                            slashColor="#ff4d6d"
                                            // Matches the ring behind the mark, so the slash
                                            // cuts a clean gap through the arcs.
                                            cutColor="#340c27"
                                        />
                                    </View>
                                </View>
                            </View>

                            <Text allowFontScaling={false} style={styles.title} accessibilityRole="header">
                                {t('offlineTitle')}
                            </Text>

                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,105,140,0.55)', 'rgba(255,255,255,0)']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.divider}
                            />

                            <Text allowFontScaling={false} style={styles.message}>
                                {t('offlineMessage')}
                            </Text>

                            <View style={styles.autoRow}>
                                <Animated.View style={[styles.autoDot, {opacity: dotOpacity}]}/>
                                <Text allowFontScaling={false} style={styles.autoText}>
                                    {t('offlineAutoRetry')}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={onRetry}
                                activeOpacity={0.85}
                                disabled={retrying}
                                style={styles.button}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('offlineRetry')}
                                accessibilityState={{disabled: retrying, busy: retrying}}
                            >
                                <LinearGradient
                                    pointerEvents="none"
                                    colors={retrying ? ['#7a2440', '#4d1226'] : ['#ff4d6d', '#c9184a']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.buttonGradient}
                                />
                                <View style={styles.buttonRow}>
                                    {retrying && (
                                        <Animated.Text
                                            allowFontScaling={false}
                                            style={[styles.spinner, {transform: [{rotate: spinRotate}]}]}
                                        >
                                            ⟳
                                        </Animated.Text>
                                    )}
                                    <Text allowFontScaling={false} style={styles.buttonText}>
                                        {retrying ? t('offlineChecking') : t('offlineRetry')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={dismiss}
                                activeOpacity={0.7}
                                style={styles.dismissButton}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('offlineDismiss')}
                            >
                                <Text allowFontScaling={false} style={styles.dismissText}>
                                    {t('offlineDismiss')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
}
