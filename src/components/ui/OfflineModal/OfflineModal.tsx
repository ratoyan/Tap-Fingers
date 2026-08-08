import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, Modal, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import WifiOffIcon, {WIFI_ARC_COUNT} from '../../../assets/icons/WifiOffIcon.tsx';
import {useNetworkStore} from '../../../store/networkStore.ts';
import {playSfx} from '../../../utils/sfx.ts';
import {haptic} from '../../../utils/haptics.ts';
import {ms} from '../../../utils/responsive.ts';
import styles from './OfflineModal.style.ts';

// Raised whenever the app can't reach the backend (see store/networkStore).
// Mounted once in App.tsx, above the navigator, so it covers whichever screen
// the player happens to be on.
//
// There is nothing to press. The connection isn't something the player can fix
// from in here, and services/connectivity.ts is already watching for it to come
// back — so the modal simply states what's happening and takes itself away the
// moment the store says we're through again.

const ICON_SIZE = ms(74);

// The signal arcs sit back in a muted lilac and the slash comes forward in a
// saturated one, so the "blocked" stroke stays the loudest thing in the mark
// even while the arcs sweep up to full brightness behind it.
const MARK_COLOR  = '#C79BE3';
const SLASH_COLOR = '#E45BFF';

export default function OfflineModal() {
    const {t} = useTranslation();

    const online = useNetworkStore(s => s.online);

    const scaleAnim   = useRef(new Animated.Value(0.7)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const shineAnim   = useRef(new Animated.Value(-1)).current;
    const haloAnim    = useRef(new Animated.Value(1)).current;
    const dotAnim     = useRef(new Animated.Value(0)).current;
    // One value per signal arc — they light up from the inside out, so the mark
    // reads as "still searching" rather than as a dead icon.
    const arcAnims    = useRef(
        Array.from({length: WIFI_ARC_COUNT}, () => new Animated.Value(0)),
    ).current;

    const shineLoop = useRef<Animated.CompositeAnimation | null>(null);
    const haloLoop  = useRef<Animated.CompositeAnimation | null>(null);
    const dotLoop   = useRef<Animated.CompositeAnimation | null>(null);
    const arcLoop   = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (online) {
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
        // These drive an SVG prop rather than a View style, which the native
        // driver can't take — three values on a screen where the game is
        // stopped anyway, so the JS thread carries it comfortably.
        arcLoop.current = Animated.loop(
            Animated.stagger(210, arcAnims.map(a => Animated.sequence([
                Animated.timing(a, {toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: false}),
                Animated.timing(a, {toValue: 0, duration: 640, easing: Easing.in(Easing.quad),  useNativeDriver: false}),
            ]))),
        );
        arcLoop.current.start();
        // Everything past `online` is a useRef value and so never changes
        // identity — listed only to keep the exhaustive-deps rule quiet.
    }, [online, arcAnims, dotAnim, haloAnim, opacityAnim, scaleAnim, shineAnim]);

    const shineTranslate = shineAnim.interpolate({inputRange: [-1, 2], outputRange: [-320, 320]});
    const dotOpacity     = dotAnim.interpolate({inputRange: [0, 1], outputRange: [0.25, 1]});
    // Built once: re-interpolating on every render would hand the SVG a new
    // node each frame the modal re-renders.
    const arcOpacities   = useMemo(
        () => arcAnims.map(a => a.interpolate({inputRange: [0, 1], outputRange: [0.16, 0.9]})),
        [arcAnims],
    );

    return (
        <Modal
            visible={!online}
            transparent
            animationType="none"
            // Nothing dismisses this but the connection itself, so the Android
            // back button is deliberately a no-op rather than a way out.
            onRequestClose={() => {}}
        >
            <View style={styles.backdrop}>
                <View style={styles.cardPress}>
                    <Animated.View
                        style={[styles.cardWrapper, {transform: [{scale: scaleAnim}], opacity: opacityAnim}]}
                    >
                        <View style={styles.card}>
                            <LinearGradient
                                pointerEvents="none"
                                colors={['#1e0040', '#0d0020', '#1a0038']}
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
                                <View style={styles.iconRing} pointerEvents="none">
                                    <WifiOffIcon
                                        size={ICON_SIZE}
                                        color={MARK_COLOR}
                                        slashColor={SLASH_COLOR}
                                        // Matches the ring behind the mark, so the slash
                                        // cuts a clean gap through the arcs.
                                        cutColor="#2a0a45"
                                        arcOpacities={arcOpacities}
                                    />
                                </View>
                            </View>

                            <Text allowFontScaling={false} style={styles.title} accessibilityRole="header">
                                {t('offlineTitle')}
                            </Text>

                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(218,112,214,0.55)', 'rgba(255,255,255,0)']}
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
                        </View>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
}
