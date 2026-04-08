import React, {useEffect, useState} from "react";
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

    const [cardsId, setCardsId] = useState<number[]>([]);
    const [backgroundsId, setBackgroundsId] = useState<number[]>([]);

    async function payBoxData(box: any, type: 'card' | 'background') {
        try {
            const isCard = type === 'card';
            const currentIds = isCard ? cardsId : backgroundsId;
            const currentSetter = isCard ? setCardsId : setBackgroundsId;
            const currentBoxSetter = isCard ? setCard : setBackground;
            const storageKeyIds = isCard ? STORAGE_KEYS.CARDSID : STORAGE_KEYS.BACKGROUNDSID;
            const storageKeyCurrent = isCard ? STORAGE_KEYS.CARDID : STORAGE_KEYS.BACKGROUNDID;

            const alreadyPurchased = box.id != null && currentIds.includes(box.id);

            // Purchase logic
            if (coins >= box.coins && !alreadyPurchased) {
                const newCoins = coins - box.coins;
                minusCoins(box.coins);
                await AsyncStorage.setItem(STORAGE_KEYS.COIN, JSON.stringify(newCoins));

                if (box.id != null) {
                    currentBoxSetter(box);
                    const updatedIds = Array.from(new Set([...currentIds, box.id]));
                    currentSetter(updatedIds);
                    await AsyncStorage.setItem(storageKeyIds, JSON.stringify(updatedIds));
                    await AsyncStorage.setItem(storageKeyCurrent, JSON.stringify(box.id));
                }
            }
            // Already purchased: just set current
            else if (alreadyPurchased && box.id != null) {
                currentBoxSetter(box);
                await AsyncStorage.setItem(storageKeyCurrent, JSON.stringify(box.id));
            }
        } catch (error) {
            console.error("Error processing box purchase:", error);
        }
    }

    async function getStorageData() {
        try {
            const purchaseCardsId = await AsyncStorage.getItem(STORAGE_KEYS.CARDSID);
            const purchaseBackgroundsId = await AsyncStorage.getItem(STORAGE_KEYS.BACKGROUNDSID);

            setCardsId(purchaseCardsId ? JSON.parse(purchaseCardsId) : []);
            setBackgroundsId(purchaseBackgroundsId ? JSON.parse(purchaseBackgroundsId) : []);
        } catch (error) {
            setCardsId([]);
            setBackgroundsId([]);
        }
    }

    useEffect(() => {
        getStorageData();
    }, [])

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
                                purchased={cardsId.includes(item.id)}
                                disabled={!cardsId.includes(item.id) && coins <= item.coins}
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
                                purchased={backgroundsId.includes(item.id)}
                                disabled={!backgroundsId.includes(item.id) && coins <= item.coins}
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
