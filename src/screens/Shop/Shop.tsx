import React, {useEffect, useRef, useState} from "react";
import {Animated, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useGlobalStore} from "../../store/globalStore.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useShopStore} from "../../store/shopStore.ts";
import {shops} from "../../data/shop.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

type TabType = 'card' | 'background';

function Shop() {
    const {t} = useTranslation();
    const {coins, minusCoins} = useGlobalStore();
    const {card, setCard, setBackground, background} = useShopStore();

    const [activeTab, setActiveTab] = useState<TabType>('card');
    const [cardsId, setCardsId] = useState<number[]>([]);
    const [backgroundsId, setBackgroundsId] = useState<number[]>([]);
    const [sortedCardItems, setSortedCardItems] = useState<any[]>([]);
    const [sortedBackgroundItems, setSortedBackgroundItems] = useState<any[]>([]);

    const tabAnim = useRef(new Animated.Value(0)).current;

    function switchTab(tab: TabType) {
        setActiveTab(tab);
        Animated.spring(tabAnim, {
            toValue: tab === 'card' ? 0 : 1,
            friction: 7,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }

    async function payBoxData(box: any, type: TabType) {
        try {
            const isCard = type === 'card';
            const currentIds = isCard ? cardsId : backgroundsId;
            const currentSetter = isCard ? setCardsId : setBackgroundsId;
            const currentBoxSetter = isCard ? setCard : setBackground;
            const storageKeyIds = isCard ? STORAGE_KEYS.CARDSID : STORAGE_KEYS.BACKGROUNDSID;
            const storageKeyCurrent = isCard ? STORAGE_KEYS.CARDID : STORAGE_KEYS.BACKGROUNDID;

            const alreadyPurchased = box.id != null && currentIds.includes(box.id);

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
            } else if (alreadyPurchased && box.id != null) {
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
            const cIds: number[] = purchaseCardsId ? JSON.parse(purchaseCardsId) : [];
            const bIds: number[] = purchaseBackgroundsId ? JSON.parse(purchaseBackgroundsId) : [];
            setCardsId(cIds);
            setBackgroundsId(bIds);
            setSortedCardItems(
                shops.filter(e => e.type === 'card')
                    .sort((a, b) => (cIds.includes(a.id) ? 0 : 1) - (cIds.includes(b.id) ? 0 : 1))
            );
            setSortedBackgroundItems(
                shops.filter(e => e.type === 'background')
                    .sort((a, b) => (bIds.includes(a.id) ? 0 : 1) - (bIds.includes(b.id) ? 0 : 1))
            );
        } catch {
            setCardsId([]);
            setBackgroundsId([]);
            setSortedCardItems(shops.filter(e => e.type === 'card'));
            setSortedBackgroundItems(shops.filter(e => e.type === 'background'));
        }
    }

    useEffect(() => {
        getStorageData();
    }, []);

    const tabIndicatorLeft = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '50%'],
    });

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
        >
            <View style={{paddingHorizontal: HORIZONAL_OFFSET, marginBottom: 15}}>
                <BackHeader
                    title={`🛒 ${t('shop')}`}
                    isShowCoin={true}
                    textStyle={{marginRight: 25}}
                    coins={coins}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                <Animated.View
                    style={[
                        styles.tab,
                        styles.tabActive,
                        {
                            position: 'absolute',
                            width: '50%',
                            height: '100%',
                            left: tabIndicatorLeft,
                        },
                    ]}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={{flex: 1, borderRadius: 14, width: '100%'}}
                    />
                </Animated.View>

                <TouchableOpacity style={styles.tab} onPress={() => switchTab('card')} activeOpacity={0.8}>
                    <Text style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>
                        🃏 {t('cards')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tab} onPress={() => switchTab('background')} activeOpacity={0.8}>
                    <Text style={[styles.tabText, activeTab === 'background' && styles.tabTextActive]}>
                        🖼 {t('backgrounds')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'card' ? (
                <ScrollView
                    key="cards"
                    contentContainerStyle={{paddingBottom: 30, marginTop: 20, paddingHorizontal: HORIZONAL_OFFSET}}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.grid}>
                        {sortedCardItems.map((item, index) => (
                            <ShopItem
                                key={item.id}
                                index={index}
                                selected={card?.id === item.id}
                                purchased={cardsId.includes(item.id)}
                                // @ts-ignore
                                disabled={!cardsId.includes(item.id) && coins <= item.coins}
                                handlePress={() => payBoxData(item, 'card')}
                                item={item}
                            />
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <ScrollView
                    key="backgrounds"
                    contentContainerStyle={{paddingBottom: 30, marginTop: 20, paddingHorizontal: HORIZONAL_OFFSET}}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.grid}>
                        {sortedBackgroundItems.map((item, index) => (
                            <ShopItem
                                key={item.id}
                                index={index}
                                selected={background?.id === item.id}
                                purchased={backgroundsId.includes(item.id)}
                                // @ts-ignore
                                disabled={!backgroundsId.includes(item.id) && coins <= item.coins}
                                handlePress={() => payBoxData(item, 'background')}
                                item={item}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
        </LinearGradient>
    );
}

export default Shop;
