import React, {useCallback, useRef, useState} from "react";
import {ActivityIndicator, Animated, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useFocusEffect} from "@react-navigation/core";
import {useGlobalStore} from "../../store/globalStore.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

// services / data
import * as shopService from "../../services/shopService.ts";
import * as userService from "../../services/userService.ts";
import * as equippedRepo from "../../db/equippedRepo.ts";
import {DEFAULT_BG_KEY, DEFAULT_CARD_KEY, mergeShopItem, registerShopIcons, ShopEntry} from "../../data/shopVisuals.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";
import WatchAdModal from "../../components/ui/WatchAdModal/WatchAdModal.tsx";

// icons
import CardsIcon from "../../assets/icons/CardsIcon.tsx";
import BackgroundsIcon from "../../assets/icons/BackgroundsIcon.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, PURPLE_DARK, WHITE} from "../../constants/colors.ts";
import {ms} from "../../utils/responsive.ts";
import LinearGradient from "react-native-linear-gradient";

// Tab icon tints: bright when active, dimmed otherwise (matches tabText).
const TAB_ICON_ACTIVE = WHITE;
const TAB_ICON_INACTIVE = 'rgba(255,255,255,0.45)';

type TabType = 'card' | 'background';

// Tier order: buyable/owned items on top, then unaffordable ("disabled") items,
// then coming-soon teasers at the very bottom. Lower number sorts first.
function sortTier(entry: ShopEntry, ownedKeys: Set<string>, coins: number): number {
    if (entry.comingSoon) return 2;
    const owned = ownedKeys.has(entry.key) || entry.priceCoins === 0;
    if (!owned && coins < entry.priceCoins) return 1;
    return 0;
}

// Coming-soon last, then disabled, then the rest — equipped on top and price
// ascending within each tier. Applied once per screen entry (in loadShop) so the
// order stays stable while equipping.
function sortByActive(list: ShopEntry[], activeKey: string, ownedKeys: Set<string>, coins: number): ShopEntry[] {
    return [...list].sort((a, b) => {
        const aTier = sortTier(a, ownedKeys, coins);
        const bTier = sortTier(b, ownedKeys, coins);
        if (aTier !== bTier) return aTier - bTier;

        const aActive = a.key === activeKey;
        const bActive = b.key === activeKey;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return a.priceCoins - b.priceCoins;
    });
}

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

            const owned = new Set(inventory.map(e => e.item.key));
            setOwnedKeys(owned);
            // Equipped skins are read from Realm first (the player's last local
            // equip), falling back to the server's active item, then the default.
            const realmEquipped = await equippedRepo.loadEquipped();
            const cardKey = realmEquipped.cardKey
                ?? inventory.find(e => e.isActiveCard)?.item.key ?? DEFAULT_CARD_KEY;
            const bgKey = realmEquipped.backgroundKey
                ?? inventory.find(e => e.isActiveBackground)?.item.key ?? DEFAULT_BG_KEY;

            // Sort once, here on entry — buyable on top, then disabled, then
            // coming-soon; equipped on top and price ascending within each tier.
            // Read coins straight from the store to avoid a stale closure value.
            // The order is frozen until the next focus, so equipping mid-session
            // doesn't make the list jump around under the user's finger.
            const coins = useGlobalStore.getState().coins;
            setCardItems(sortByActive(merged.filter(e => e.type === 'card'), cardKey, owned, coins));
            setBgItems(sortByActive(merged.filter(e => e.type === 'background'), bgKey, owned, coins));
            setActiveCardKey(cardKey);
            setActiveBgKey(bgKey);
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
        // await shopService.setActiveItem(entry.key);
        if (entry.type === 'card') {
            // Save the equipped card to Realm so it survives restarts and is
            // read back locally (see loadShop).
            await equippedRepo.saveEquippedCard(entry.key);
            setActiveCardKey(entry.key);
            patchStats({activeCardKey: entry.key});
        } else {
            await equippedRepo.saveEquippedBackground(entry.key);
            setActiveBgKey(entry.key);
            patchStats({activeBackgroundKey: entry.key});
        }
    }

    async function handleItemPress(entry: ShopEntry) {
        // Teasers are locked — visible but not purchasable/equippable.
        if (entry.comingSoon) return;
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

    // Items are pre-sorted at load time (see loadShop) and intentionally NOT
    // re-sorted when the active key changes — equipping updates the "Equipped"
    // badge but keeps the list order stable. It re-sorts on the next focus.
    const items = activeTab === 'card' ? cardItems : bgItems;
    const activeKey = activeTab === 'card' ? activeCardKey : activeBgKey;

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE_DARK, PURPLE_DARK, PURPLE]}
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

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => switchTab('card')}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel={t('cards')}
                    accessibilityState={{selected: activeTab === 'card'}}
                >
                    <View style={styles.tabInner}>
                        <CardsIcon size={ms(20)} color={activeTab === 'card' ? TAB_ICON_ACTIVE : TAB_ICON_INACTIVE}/>
                        <Text allowFontScaling={false}
                              style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>
                            {t('cards')}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => switchTab('background')}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel={t('backgrounds')}
                    accessibilityState={{selected: activeTab === 'background'}}
                >
                    <View style={styles.tabInner}>
                        <BackgroundsIcon size={ms(20)}
                                         color={activeTab === 'background' ? TAB_ICON_ACTIVE : TAB_ICON_INACTIVE}/>
                        <Text allowFontScaling={false}
                              style={[styles.tabText, activeTab === 'background' && styles.tabTextActive]}>
                            {t('backgrounds')}
                        </Text>
                    </View>
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
