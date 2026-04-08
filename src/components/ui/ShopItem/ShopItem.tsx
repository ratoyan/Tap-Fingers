import React from "react";
import {Text, TouchableOpacity, View} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";
import Ballon from "../../../assets/icons/Ballon.tsx";

// styles
import styles from './ShopItem.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, MEDIUM_PURPLE, ORCHID, PLUM} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface ShopItemProps {
    item: any;
    handlePress?: () => void;
    disabled?: boolean; // optional prop
}

function ShopItem({item, handlePress, disabled = false}: ShopItemProps) {

    const getIcon = () => {
        switch (item.typeName) {
            case 'card':
                const colors = ['red', 'blue', 'green', 'yellow'];
                return (
                    <View style={styles.typeCardView}>
                        {colors.map((color, index) => (
                            <View
                                key={index}
                                style={[styles.typeCardItem, {backgroundColor: color}]}
                            />
                        ))}
                    </View>
                );
            case 'ballon':
                return <Ballon width={100} height={100}/>;
            default:
                return null;
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={styles.cardWrapper}
            disabled={disabled} // disables the touch

            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityHint={
                disabled
                    ? "Item is locked"
                    : "Double tap to purchase"
            }
            accessibilityState={{disabled}}
        >
            <LinearGradient
                colors={disabled ? [MEDIUM_PURPLE, MEDIUM_PURPLE] : [GRADIENT_LIGHT, GRADIENT_DARK]} // gray out if disabled
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.card}

                importantForAccessibility="no-hide-descendants"
            >
                <View
                    style={{
                        height: 100,
                        width: '100%',
                        backgroundColor: PLUM,
                        borderRadius: 10,
                        opacity: disabled ? 0.5 : 1, // optional: fade content if disabled
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignContent: 'center'
                    }}
                >
                    {getIcon()}
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <View style={[styles.priceContainer, disabled && {backgroundColor: ORCHID}]}>
                    <Text style={styles.price}>{item.coins}</Text>
                    <Coin width={22} height={20}/>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default ShopItem;