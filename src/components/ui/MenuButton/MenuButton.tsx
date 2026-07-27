import React, {useCallback, useRef} from "react";
import {Animated, Easing, Text, TouchableOpacity} from "react-native";
import {MenuType} from "../../../types/menu.type.ts";
import {useTranslation} from "react-i18next";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {haptic} from "../../../utils/haptics.ts";
import {playSfxVaried} from "../../../utils/sfx.ts";

// icons
import {MENU_ICONS} from "../../../assets/icons/MenuIcons.tsx";

// styles
import styles, {MENU_BUTTON_WIDTH, MENU_ICON_SIZE} from './MenuButton.style.ts';
import {ORCHID, PURPLE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

// ── Entrance choreography ───────────────────────────────────────────────────
// The menu deals itself out like a hand of cards: buttons fly in from
// alternating sides, tilted, and spring level; the icon pops a beat later; a
// gloss band then rakes across each one at the same -18° the shop items, the
// notice card and the wheel already use. Timing lives here rather than in Home
// so the button owns its whole arrival — Home only says which seat it's in.
export const MENU_ENTER_LEAD = 90;      // before the first button moves
export const MENU_ENTER_STAGGER = 85;   // between consecutive buttons
const ICON_POP_DELAY = 140;
const SWEEP_DELAY = 210;
const SWEEP_MS = 640;
const BAND_W = MENU_BUTTON_WIDTH * 0.42;

interface MenuProps {
    menu: MenuType
    /** Seat in the menu — drives the stagger and which side it flies in from. */
    index?: number
}

function MenuButton({menu, index = 0}: MenuProps){
    const Icon = MENU_ICONS[menu.icon];
    const {t} = useTranslation();
    const navigation = useNavigation();
    const scale = useRef(new Animated.Value(1)).current;   // press feedback
    const enter = useRef(new Animated.Value(0)).current;   // 0 → 1 fly-in
    const iconPop = useRef(new Animated.Value(0)).current; // icon lands late
    const sweep = useRef(new Animated.Value(0)).current;   // one-shot gloss

    // Odd rows come from the right, even from the left.
    const dir = index % 2 === 0 ? -1 : 1;

    // Replays on every focus, so returning from a round re-deals the menu
    // instead of dropping the player onto a static screen. All three values
    // drive transforms/opacity only, so the whole thing stays on the native
    // thread while Home does its focus work (profile, wheel, config) on JS.
    useFocusEffect(
        useCallback(() => {
            enter.setValue(0);
            iconPop.setValue(0);
            sweep.setValue(0);

            const anim = Animated.sequence([
                Animated.delay(MENU_ENTER_LEAD + index * MENU_ENTER_STAGGER),
                Animated.parallel([
                    // Spring, not timing: the tilt straightening out with a
                    // little wobble is what sells the card-deal read.
                    Animated.spring(enter, {
                        toValue: 1,
                        friction: 6.5,
                        tension: 58,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.delay(ICON_POP_DELAY),
                        Animated.spring(iconPop, {
                            toValue: 1,
                            friction: 4.5,
                            tension: 90,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.delay(SWEEP_DELAY),
                        Animated.timing(sweep, {
                            toValue: 1,
                            duration: SWEEP_MS,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]);

            anim.start();
            return () => anim.stop();
        }, [enter, iconPop, sweep, index]),
    );

    // Feedback for a page switch from the menu: a light buzz plus the browsing
    // sound (pitch-varied so repeated taps don't hit the same note).
    const handleNavigate = () => {
        haptic('equip');
        playSfxVaried('equip');
        // @ts-ignore
        navigation.navigate(menu.navigateTo);
    };

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const translateX = enter.interpolate({
        inputRange: [0, 1],
        outputRange: [dir * MENU_BUTTON_WIDTH * 0.85, 0],
    });
    const rotate = enter.interpolate({
        inputRange: [0, 1],
        outputRange: [`${dir * 9}deg`, '0deg'],
    });
    // Opaque well before the spring settles, so the overshoot reads as motion
    // rather than a flicker.
    const opacity = enter.interpolate({inputRange: [0, 0.45], outputRange: [0, 1], extrapolate: 'clamp'});
    const enterScale = enter.interpolate({inputRange: [0, 1], outputRange: [0.9, 1]});

    const iconScale = iconPop.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]});
    const iconSpin = iconPop.interpolate({inputRange: [0, 1], outputRange: ['-35deg', '0deg']});

    const sweepX = sweep.interpolate({inputRange: [0, 1], outputRange: [-BAND_W, MENU_BUTTON_WIDTH]});
    // Held off until the band is on the button and cut before it clears the far
    // edge — a gloss that fades in and out, not a strip parked at the border.
    const sweepOpacity = sweep.interpolate({
        inputRange: [0, 0.12, 0.8, 1],
        outputRange: [0, 1, 1, 0],
    });

    return (
        <Animated.View
            style={{
                opacity,
                transform: [
                    {translateX},
                    {rotate},
                    // Press feedback multiplies into the entrance scale so a tap
                    // mid-arrival doesn't fight it for the same transform slot.
                    {scale: Animated.multiply(scale, enterScale)},
                ],
            }}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNavigate}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.buttonContainer}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t(menu.title)}
            >
                <LinearGradient
                    colors={[PURPLE, ORCHID]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                >
                    {Icon ? (
                        <Animated.View
                            style={[styles.icon, {transform: [{scale: iconScale}, {rotate: iconSpin}]}]}
                        >
                            <Icon size={MENU_ICON_SIZE}/>
                        </Animated.View>
                    ) : null}
                    <Text allowFontScaling={false} style={styles.title}>{t(menu.title)}</Text>
                </LinearGradient>

                {/* Sibling of the gradient so it sits over both the label and
                    the icon, inside the clipped container. */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.sweep,
                        {opacity: sweepOpacity, transform: [{translateX: sweepX}, {skewX: '-18deg'}]},
                    ]}
                >
                    <LinearGradient
                        colors={[
                            'rgba(255,255,255,0)',
                            'rgba(0,245,255,0.20)',
                            'rgba(255,255,255,0.42)',
                            'rgba(255,0,255,0.18)',
                            'rgba(255,255,255,0)',
                        ]}
                        locations={[0, 0.3, 0.5, 0.7, 1]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.sweepFill}
                    />
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    )
}

export default React.memo(MenuButton);
