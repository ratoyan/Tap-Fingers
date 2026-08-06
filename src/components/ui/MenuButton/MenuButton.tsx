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
// The menu settles in rather than announcing itself: each button drifts a short
// way in from its side — alternating, so the eye is led down the list — with a
// hair of tilt, and eases level on a decelerating curve with no bounce. The icon
// follows half a beat behind, and a faint gloss drifts across at the same -18°
// the shop items, the notice card and the wheel already use.
//
// The restraint is deliberate: this screen is seen dozens of times a session, so
// the arrival has to stay watchable on the fiftieth viewing, not just the first.
// Distance and rotation are small, opacity does most of the work, and nothing
// overshoots. Timing lives here rather than in Home so the button owns its whole
// arrival — Home only says which seat it's in.
export const MENU_ENTER_LEAD = 70;      // before the first button moves
export const MENU_ENTER_STAGGER = 72;   // between consecutive buttons
const ENTER_MS = 540;
const ICON_POP_DELAY = 130;
const ICON_POP_MS = 430;
const SWEEP_DELAY = 260;
const SWEEP_MS = 900;
// Travel in dp. A drift, not a fly-in — far enough to have a direction, short
// enough that five of them in sequence never read as clutter.
const ENTER_SHIFT = 22;
// Wide and faint beats narrow and bright: a broad band reads as light moving
// over the surface, a narrow one as a stripe crossing it.
const BAND_W = MENU_BUTTON_WIDTH * 0.55;

// One decelerating curve for the whole screen — fast off the mark, long tail,
// no overshoot. Entrance uses the same one, so nothing on Home moves to a
// different rhythm than anything else.
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);

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
                    // Timing on SETTLE, not a spring: a spring's overshoot puts
                    // a wobble on the tilt, and five wobbles down the list is
                    // the difference between the menu arriving and the menu
                    // performing.
                    // isInteraction on all three: native-driven animations are
                    // invisible to InteractionManager unless they ask to be
                    // counted, and Home parks its focus work behind them so the
                    // JS thread stays free while the menu comes in.
                    Animated.timing(enter, {
                        toValue: 1,
                        duration: ENTER_MS,
                        easing: SETTLE,
                        useNativeDriver: true,
                        isInteraction: true,
                    }),
                    Animated.sequence([
                        Animated.delay(ICON_POP_DELAY),
                        Animated.timing(iconPop, {
                            toValue: 1,
                            duration: ICON_POP_MS,
                            easing: SETTLE,
                            useNativeDriver: true,
                            isInteraction: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.delay(SWEEP_DELAY),
                        Animated.timing(sweep, {
                            toValue: 1,
                            duration: SWEEP_MS,
                            // Eased at both ends: the gloss drifts on and drifts
                            // off instead of being flung across.
                            easing: Easing.inOut(Easing.cubic),
                            useNativeDriver: true,
                            isInteraction: true,
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
        outputRange: [dir * ENTER_SHIFT, 0],
    });
    // Barely more than a degree. Enough to keep the button from arriving flat,
    // little enough that you'd have to look for it.
    const rotate = enter.interpolate({
        inputRange: [0, 1],
        outputRange: [`${dir * 1.6}deg`, '0deg'],
    });
    // Trails the motion instead of racing ahead of it: over such a short travel
    // an early fade-in would leave the last third looking static.
    const opacity = enter.interpolate({inputRange: [0, 0.65], outputRange: [0, 1], extrapolate: 'clamp'});
    const enterScale = enter.interpolate({inputRange: [0, 1], outputRange: [0.97, 1]});

    const iconScale = iconPop.interpolate({inputRange: [0, 1], outputRange: [0.78, 1]});
    const iconSpin = iconPop.interpolate({inputRange: [0, 1], outputRange: ['-9deg', '0deg']});

    const sweepX = sweep.interpolate({inputRange: [0, 1], outputRange: [-BAND_W, MENU_BUTTON_WIDTH]});
    // A long fade up and a longer fade down, so the gloss has no hard edge in
    // time either — it gathers, crosses, and is gone.
    const sweepOpacity = sweep.interpolate({
        inputRange: [0, 0.3, 0.6, 1],
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
                {/* Absolute-fill background so the row layout lives on the plain
                    TouchableOpacity above — a LinearGradient owning the flex
                    layout mis-centres its content on iOS Fabric. */}
                <LinearGradient
                    pointerEvents="none"
                    colors={[PURPLE, ORCHID]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                />
                {Icon ? (
                    <Animated.View
                        style={[styles.icon, {transform: [{scale: iconScale}, {rotate: iconSpin}]}]}
                    >
                        <Icon size={MENU_ICON_SIZE}/>
                    </Animated.View>
                ) : null}
                <Text allowFontScaling={false} style={styles.title}>{t(menu.title)}</Text>

                {/* Sibling of the gradient so it sits over both the label and
                    the icon, inside the clipped container. The band itself is
                    roughly half its old intensity spread over a wider span: a
                    sheen picking up the gradient underneath, rather than a light
                    being shone at it. */}
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
                            'rgba(0,245,255,0.09)',
                            'rgba(255,255,255,0.20)',
                            'rgba(255,0,255,0.08)',
                            'rgba(255,255,255,0)',
                        ]}
                        locations={[0, 0.32, 0.5, 0.68, 1]}
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
