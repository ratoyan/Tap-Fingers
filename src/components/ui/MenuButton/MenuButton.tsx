import React from "react";
import {Animated, Text, TouchableOpacity} from "react-native";
import {useNavigation} from "@react-navigation/core";
import {MenuType} from "../../../types/menu.type.ts";

// styles
import styles from './MenuButton.style.ts';
import {ORCHID, PURPLE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface MenuProps {
    menu: MenuType
}

function MenuButton({menu}: MenuProps){
    const navigation = useNavigation();
    const scale = new Animated.Value(1);

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
                // @ts-ignore
                onPress={() => navigation.navigate(menu.navigateTo)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.buttonContainer}
            >
                <LinearGradient
                    colors={[PURPLE, ORCHID]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                >
                    <Text style={styles.icon}>{menu.icon}</Text>
                    <Text style={styles.title}>{menu.title}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    )
}

export default MenuButton;