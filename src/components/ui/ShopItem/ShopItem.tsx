import {Text, TouchableOpacity, View} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import React from "react";

// styles
import styles from './ShopItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT} from "../../../constants/colors.ts";

interface ShopItemProps {
    item: any
}

function ShopItem({item}: ShopItemProps) {
    return (
        <TouchableOpacity activeOpacity={0.8} style={styles.cardWrapper}>
            <LinearGradient
                colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.card}
            >
                <Text style={styles.icon}>{item.icon}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{item.price}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    )
}

export default ShopItem;