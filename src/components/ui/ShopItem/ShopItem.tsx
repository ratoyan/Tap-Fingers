import {Text, TouchableOpacity, View} from "react-native";
import React from "react";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ShopItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, PLUM} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

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
                {/*<Text style={styles.icon}>{item.icon}</Text>*/}
                <View style={{height: 100, width: '100%', backgroundColor: PLUM, borderRadius: 10}}>

                </View>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{item.price}</Text>
                    <Coin width={22} height={20}/>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    )
}

export default ShopItem;