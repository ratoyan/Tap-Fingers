import React from "react";
import {View, Text, ScrollView} from "react-native";
import {useTranslation} from "react-i18next";
import {useGlobalStore} from "../../store/globalStore.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useShopStore} from "../../store/shopStore.ts";
import {shops} from "../../data/shop.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

function Shop() {
    const {t} = useTranslation();
    const {coins, minusCoins} = useGlobalStore();
    const {card, setCard, setBackground, background} = useShopStore();

    async function payBoxData(box: any, type: 'card' | 'background') {
        if (coins >= box.coins) {
            const newCoins = coins - box.coins;
            minusCoins(box.coins);
            await AsyncStorage.setItem(STORAGE_KEYS.COIN, JSON.stringify(newCoins));

            if (type === 'card') {
                setCard(box);
                if (box.id != null) {
                    await AsyncStorage.setItem(STORAGE_KEYS.CARDID, JSON.stringify(box.id));
                }
            } else if (type === 'background') {
                setBackground(box);
                if (box.id != null) {
                    await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUNDID, JSON.stringify(box.id));
                }
            }
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
                    {shops
                        .filter((e: any) => e.type === 'card')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                selected={card?.id === item.id}
                                handlePress={() => payBoxData(item, 'card')}
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
                    {shops
                        .filter((e: any) => e.type === 'background')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                selected={background?.id === item.id}
                                handlePress={() => payBoxData(item, 'background')}
                                item={item}
                            />
                        ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Shop;
