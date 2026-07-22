import React, {useRef} from "react";
import {Animated, Text, TouchableOpacity, View} from "react-native";
import {MenuType} from "../../../types/menu.type.ts";
import {useTranslation} from "react-i18next";
import {useNavigation} from "@react-navigation/core";
import {haptic} from "../../../utils/haptics.ts";
import {playSfxVaried} from "../../../utils/sfx.ts";

// icons
import {MENU_ICONS} from "../../../assets/icons/MenuIcons.tsx";

// styles
import styles, {MENU_ICON_SIZE} from './MenuButton.style.ts';
import {ORCHID, PURPLE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface MenuProps {
    menu: MenuType
}

function MenuButton({menu}: MenuProps){
    const Icon = MENU_ICONS[menu.icon];
    const {t} = useTranslation();
    const navigation = useNavigation();
    const scale = useRef(new Animated.Value(1)).current;

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

    return (
        <Animated.View style={{transform: [{scale}]}}>
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
                        <View style={styles.icon}>
                            <Icon size={MENU_ICON_SIZE}/>
                        </View>
                    ) : null}
                    <Text allowFontScaling={false} style={styles.title}>{t(menu.title)}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    )
}

export default React.memo(MenuButton);