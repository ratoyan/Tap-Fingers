import React from "react";
import {View, Text, ScrollView} from "react-native";
import {useTranslation} from "react-i18next";
import {useGlobalStore} from "../../store/globalStore.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

const ITEMS = [
    {id: "1", title: "Card 1", coins: "500", type: 'card', typeName: 'ballon'},
    {id: "2", title: "Card 2", coins: "800", type: 'card', typeName: 'card'},
    {id: "5", title: "Background 1", coins: "200", type: 'background', typeName: 'background'},
    {id: "6", title: "Background 2", coins: "300", type: 'background', typeName: 'background'},
];

function Shop() {
    const {t} = useTranslation();
    const {coins, minusCoins} = useGlobalStore();

    async function payBoxData(box: any) {
        if (coins >= box.coins) {
            const newCoins = coins - box.coins;
            minusCoins(box.coins);
            await AsyncStorage.setItem(STORAGE_KEYS.COIN, JSON.stringify(newCoins));
        }
    }

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Shop screen"
        >
            <BackHeader
                title={`🛒 ${t('shop')}`}
                isShowCoin={true}
                textStyle={{marginRight: 25}}
                coins={coins}
            />

            <ScrollView
                contentContainerStyle={{paddingBottom: 20}}
                showsVerticalScrollIndicator={false}
                accessibilityRole="scrollbar"
                accessibilityHint="Swipe up or down to browse shop items"
            >
                <Text
                    style={styles.sectionTitle}
                    accessibilityRole="header"
                >
                    {t('cards')}
                </Text>

                <View
                    style={styles.grid}
                    accessible={true}
                    accessibilityRole="list"
                    accessibilityLabel={`${t('cards')} list`}
                >
                    {ITEMS
                        .filter((e: any) => e.type === 'card')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                handlePress={() => payBoxData(item)}
                                item={item}
                            />
                        ))}
                </View>

                <Text
                    style={styles.sectionTitle}
                    accessibilityRole="header"
                >
                    {t('backgrounds')}
                </Text>

                <View
                    style={styles.grid}
                    accessible={true}
                    accessibilityRole="list"
                    accessibilityLabel={`${t('backgrounds')} list`}
                >
                    {ITEMS
                        .filter((e: any) => e.type === 'background')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                handlePress={() => payBoxData(item)}
                                item={item}
                            />
                        ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Shop;
