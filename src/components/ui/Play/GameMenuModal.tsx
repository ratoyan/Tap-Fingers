import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {ms, vs} from '../../../utils/responsive.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, WHITE} from '../../../constants/colors.ts';

// icons
import ExitIcon from '../../../assets/icons/ExitIcon.tsx';
import PlayIcon from '../../../assets/icons/PlayIcon.tsx';

// components
import SettingsModal from './SettingsModal.tsx';

interface GameMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onExit: () => void;
}

// Rows animate in one after another rather than as a block — the eye follows the
// cascade down to the exit button, which is the reading order we want anyway.
const ROW_STAGGER = 70;
const ROW_COUNT = 3;

function GameMenuModal({visible, onClose, onExit}: GameMenuModalProps) {
    const {t} = useTranslation();
    const [settingsVisible, setSettingsVisible] = useState(false);

    // `visible` can go false while the close animation is still running, so the
    // component keeps its own mounted flag and unmounts itself at the end of it.
    // Without this the modal vanished on the frame the prop flipped and the exit
    // animation never had anything to play on.
    const [mounted, setMounted] = useState(visible);

    const backdrop = useRef(new Animated.Value(0)).current;
    const card = useRef(new Animated.Value(0)).current;
    const rows = useRef(Array.from({length: ROW_COUNT}, () => new Animated.Value(0))).current;
    const glow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Only reset to the "from" state and mount here. The entrance is
            // deliberately NOT started in this pass: `mounted` is still false
            // right now, so the component is returning null and none of the
            // card's views exist yet. Starting the animation against a subtree
            // that hasn't mounted meant its first frames played against nothing
            // and the card snapped in partway through — the jank on open.
            backdrop.setValue(0);
            card.setValue(0);
            rows.forEach(r => r.setValue(0));
            setMounted(true);
        } else if (mounted) {
            // Leaving is faster than arriving and doesn't bounce — a spring on the
            // way out makes a dismissal feel hesitant.
            Animated.parallel([
                Animated.timing(backdrop, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(card, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(({finished}) => {
                if (finished) setMounted(false);
            });
        }
    }, [visible]);

    // The entrance, in its own effect so it runs on the commit *after* the one
    // that mounted the card — by now the views are real and the animation has
    // something to drive from frame one.
    useEffect(() => {
        if (!mounted || !visible) return;

        const entrance = Animated.parallel([
            // The dim comes in on its own timing: a spring on the backdrop
            // would overshoot into pure black and back, which reads as a flash.
            Animated.timing(backdrop, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.spring(card, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true,
            }),
            Animated.stagger(ROW_STAGGER, rows.map(r =>
                Animated.spring(r, {
                    toValue: 1,
                    friction: 7,
                    tension: 80,
                    useNativeDriver: true,
                }),
            )),
        ]);
        entrance.start();
        return () => entrance.stop();
    }, [mounted, visible]);

    // Slow breathing halo behind the card. It's the only thing moving while the
    // menu sits open, which keeps a paused screen from looking frozen.
    useEffect(() => {
        if (!mounted) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(glow, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(glow, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [mounted]);

    if (!mounted) return null;

    // The card tilts back on the X axis as it drops in, so it reads as a panel
    // swinging up to face the player rather than a rectangle being scaled.
    // `perspective` has to come first in the list or the rotation renders flat.
    const cardStyle = {
        opacity: card,
        transform: [
            {perspective: 900},
            {translateY: card.interpolate({inputRange: [0, 1], outputRange: [vs(44), 0]})},
            {scale: card.interpolate({inputRange: [0, 1], outputRange: [0.86, 1]})},
            {rotateX: card.interpolate({inputRange: [0, 1], outputRange: ['16deg', '0deg']})},
        ],
    };

    const rowStyle = (i: number) => ({
        opacity: rows[i],
        transform: [
            {translateY: rows[i].interpolate({inputRange: [0, 1], outputRange: [vs(20), 0]})},
            // Slight overshoot past 1 on the spring is what gives each row its
            // pop; scaling from below 1 alone just looks like a fade.
            {scale: rows[i].interpolate({inputRange: [0, 1], outputRange: [0.94, 1]})},
        ],
    });

    return (
        <>
            <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
                <Animated.View style={[styles.dim, {opacity: backdrop}]} />

                {/* The ring lives in a plain wrapper rather than inside the card:
                    it sits outside the card's bounds, and a parent with a
                    borderRadius clips overflowing children on Android. The
                    wrapper has neither, so nothing is cut off.

                    A filled halo would need a blur to avoid a hard circular
                    edge and RN has none without a native dependency — a ring is
                    crisp by design and suits the neon palette better anyway. */}
                <Animated.View style={[styles.cardWrap, cardStyle]}>
                    <Animated.View
                        style={[
                            styles.glowRing,
                            {
                                opacity: glow.interpolate({inputRange: [0, 1], outputRange: [0.18, 0.6]}),
                                transform: [
                                    {scale: glow.interpolate({inputRange: [0, 1], outputRange: [1, 1.025]})},
                                ],
                            },
                        ]}
                        pointerEvents="none"
                    />

                    <View style={styles.modal}>

                        {/* Title */}
                        <Animated.View style={[styles.titleRow, rowStyle(0)]}>
                            <View style={styles.pauseBars}>
                                <View style={styles.pauseBar} />
                                <View style={styles.pauseBar} />
                            </View>
                            <Text allowFontScaling={false} style={styles.title}>{t('pause')}</Text>
                        </Animated.View>

                        <Animated.View style={[styles.divider, rowStyle(0)]} />

                        {/* Resume */}
                        <Animated.View style={[styles.row, rowStyle(0)]}>
                            <TouchableOpacity
                                onPressIn={onClose}
                                activeOpacity={0.85}
                                style={styles.btn}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('play')}
                            >
                                <LinearGradient
                                    colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 1}}
                                    style={styles.btnGradient}
                                >
                                    <PlayIcon size={18} color={WHITE} />
                                    <Text allowFontScaling={false} style={styles.resumeText}>{t('play')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Settings */}
                        <Animated.View style={[styles.row, rowStyle(1)]}>
                            <TouchableOpacity
                                onPressIn={() => setSettingsVisible(true)}
                                activeOpacity={0.85}
                                style={[styles.btn, styles.settingsBtn]}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('settings')}
                            >
                                <Text allowFontScaling={false} style={styles.settingsText}>⚙️  {t('settings')}</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Exit Game */}
                        <Animated.View style={[styles.row, rowStyle(2)]}>
                            <TouchableOpacity
                                onPressIn={onExit}
                                activeOpacity={0.85}
                                style={styles.exitBtnWrapper}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={t('exitGame')}
                            >
                                <LinearGradient
                                    colors={['#3a0060', '#6a0dad']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 1}}
                                    style={styles.exitGradient}
                                >
                                    <ExitIcon size={18} color="#DDA0DD" />
                                    <Text allowFontScaling={false} style={styles.exitText}>{t('exitGame')}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                    </View>
                </Animated.View>
            </View>

            <SettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    // Split out of `overlay` so the dim can fade on the native driver while the
    // container itself stays a plain, always-laid-out View.
    dim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.78)',
    },
    glowRing: {
        position: 'absolute',
        top: -ms(7),
        left: -ms(7),
        right: -ms(7),
        bottom: -ms(7),
        borderRadius: ms(28),
        borderWidth: ms(2),
        borderColor: '#c77dff',
    },
    cardWrap: {
        width: '84%',
    },
    modal: {
        width: '100%',
        backgroundColor: '#1a0030',
        borderRadius: ms(22),
        borderWidth: 1.5,
        borderColor: '#8e2de2',
        paddingHorizontal: ms(20),
        paddingTop: ms(20),
        paddingBottom: ms(20),
        alignItems: 'center',
        gap: ms(12),
        shadowColor: '#8e2de2',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: ms(10),
    },
    // Drawn rather than an emoji or an icon import: two bars is the whole glyph,
    // and this way it inherits the palette instead of the system font's.
    pauseBars: {
        flexDirection: 'row',
        gap: ms(3),
    },
    pauseBar: {
        width: ms(4),
        height: ms(15),
        borderRadius: ms(2),
        backgroundColor: '#DDA0DD',
    },
    title: {
        color: '#DDA0DD',
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 2,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(221,160,221,0.15)',
    },
    row: {
        width: '100%',
    },
    btn: {
        width: '100%',
    },
    btnGradient: {
        borderRadius: ms(14),
        paddingVertical: vs(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
    },
    resumeText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    settingsBtn: {
        backgroundColor: 'rgba(142,45,226,0.18)',
        borderRadius: ms(14),
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.25)',
        paddingVertical: vs(14),
        alignItems: 'center',
    },
    settingsText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    exitBtnWrapper: {
        width: '100%',
        borderRadius: ms(14),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.3)',
    },
    exitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
        paddingVertical: vs(13),
    },
    exitText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(GameMenuModal);
