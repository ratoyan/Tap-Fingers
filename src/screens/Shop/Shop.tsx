import React, {useCallback, useMemo, useRef, useState} from "react";
import {ActivityIndicator, Animated, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useFocusEffect} from "@react-navigation/core";
import {useGlobalStore} from "../../store/globalStore.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

// services / data
import * as shopService from "../../services/shopService.ts";
import * as userService from "../../services/userService.ts";
import {DEFAULT_BG_KEY, DEFAULT_CARD_KEY, mergeShopItem, registerShopIcons, ShopEntry} from "../../data/shopVisuals.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";
import WatchAdModal from "../../components/ui/WatchAdModal/WatchAdModal.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, WHITE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

type TabType = 'card' | 'background';

function Shop() {
    const {t} = useTranslation();
    const {coins} = useGlobalStore();
    const patchStats = useAuthStore(s => s.patchStats);

    const [activeTab, setActiveTab] = useState<TabType>('card');
    const [showAdModal, setShowAdModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const [cardItems, setCardItems] = useState<ShopEntry[]>([]);
    const [bgItems, setBgItems] = useState<ShopEntry[]>([]);
    const [ownedKeys, setOwnedKeys] = useState<Set<string>>(new Set());
    const [activeCardKey, setActiveCardKey] = useState<string>(DEFAULT_CARD_KEY);
    const [activeBgKey, setActiveBgKey] = useState<string>(DEFAULT_BG_KEY);

    const tabAnim = useRef(new Animated.Value(0)).current;

    // Free starter items count as owned even before they hit the inventory table.
    function isOwned(entry: ShopEntry) {
        return ownedKeys.has(entry.key) || entry.priceCoins === 0;
    }

    async function loadShop() {
        try {
            const [items, inventory] = await Promise.all([
                shopService.getItems(),
                shopService.getInventory(),
            ]);

            registerShopIcons(items);
            const merged = items.map(mergeShopItem);
            setCardItems(merged.filter(e => e.type === 'card'));
            setBgItems(merged.filter(e => e.type === 'background'));

            setOwnedKeys(new Set(inventory.map(e => e.item.key)));
            const card = inventory.find(e => e.isActiveCard)?.item.key;
            const bg = inventory.find(e => e.isActiveBackground)?.item.key;
            setActiveCardKey(card ?? DEFAULT_CARD_KEY);
            setActiveBgKey(bg ?? DEFAULT_BG_KEY);
        } catch (error) {
            console.error('Failed to load shop:', error);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadShop();
        }, [])
    );

    function switchTab(tab: TabType) {
        setActiveTab(tab);
        Animated.spring(tabAnim, {
            toValue: tab === 'card' ? 0 : 1,
            friction: 7,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }

    async function equip(entry: ShopEntry) {
        await shopService.setActiveItem(entry.key);
        if (entry.type === 'card') {
            setActiveCardKey(entry.key);
            patchStats({activeCardKey: entry.key});
        } else {
            setActiveBgKey(entry.key);
            patchStats({activeBackgroundKey: entry.key});
        }
    }

    async function handleItemPress(entry: ShopEntry) {
        if (busyKey) return;
        setBusyKey(entry.key);
        try {
            if (isOwned(entry)) {
                // Already owned (or free) — just equip it.
                await equip(entry);
            } else if (coins >= entry.priceCoins) {
                // Buy, then equip — matches the previous one-tap behaviour.
                const result = await shopService.purchaseItem(entry.key);
                setOwnedKeys(prev => new Set(prev).add(entry.key));
                patchStats({coins: result.remainingCoins});
                await equip(entry);
            }
        } catch (error) {
            console.error('Shop action failed:', error);
            // Re-sync from the server so the UI reflects the real state.
            loadShop();
        } finally {
            setBusyKey(null);
        }
    }

    const tabIndicatorLeft = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '50%'],
    });

    // Card ordering: the equipped (active) card rises to the top; everything
    // else is sorted by price, cheapest first. Recomputed when the equipped
    // card changes so the list re-orders right after equipping.
    const sortedCardItems = useMemo(() => {
        return [...cardItems].sort((a, b) => {
            const aActive = a.key === activeCardKey;
            const bActive = b.key === activeCardKey;
            if (aActive !== bActive) return aActive ? -1 : 1;
            return a.priceCoins - b.priceCoins;
        });
    }, [cardItems, activeCardKey]);

    // Background ordering mirrors the cards: equipped one on top, the rest by
    // price ascending. Re-orders right after equipping a different background.
    const sortedBgItems = useMemo(() => {
        return [...bgItems].sort((a, b) => {
            const aActive = a.key === activeBgKey;
            const bActive = b.key === activeBgKey;
            if (aActive !== bActive) return aActive ? -1 : 1;
            return a.priceCoins - b.priceCoins;
        });
    }, [bgItems, activeBgKey]);

    const items = activeTab === 'card' ? sortedCardItems : sortedBgItems;
    const activeKey = activeTab === 'card' ? activeCardKey : activeBgKey;

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
                    onCoinPress={() => setShowAdModal(true)}
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
                    <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>
                        🃏 {t('cards')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tab} onPress={() => switchTab('background')} activeOpacity={0.8}>
                    <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'background' && styles.tabTextActive]}>
                        🖼 {t('backgrounds')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={WHITE}/>
                </View>
            ) : (
                <ScrollView
                    key={activeTab}
                    contentContainerStyle={{paddingBottom: 30, marginTop: 20, paddingHorizontal: HORIZONAL_OFFSET}}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.grid}>
                        {items.map((item, index) => (
                            <ShopItem
                                key={item.id}
                                index={index}
                                selected={item.key === activeKey}
                                purchased={isOwned(item)}
                                disabled={!isOwned(item) && coins < item.priceCoins}
                                handlePress={() => handleItemPress(item)}
                                item={item}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}

            <WatchAdModal
                visible={showAdModal}
                onCollect={async () => {
                    try {
                        const result = await userService.claimAdReward();
                        patchStats({coins: result.totalCoins});
                    } catch {
                        // Daily limit reached or offline.
                    }
                }}
                onClose={() => setShowAdModal(false)}
            />
        </LinearGradient>
    );
}

export default Shop;
