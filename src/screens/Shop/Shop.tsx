import React, {useCallback, useRef, useState} from "react";
import {Animated, InteractionManager, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useFocusEffect} from "@react-navigation/core";
import {useGlobalStore} from "../../store/globalStore.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {useConfigStore} from "../../store/configStore.ts";
import {useDailyChallengesStore} from "../../store/dailyChallengesStore.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

// services / data
import * as shopService from "../../services/shopService.ts";
import * as userService from "../../services/userService.ts";
import * as equippedRepo from "../../db/equippedRepo.ts";
import * as localOwnedRepo from "../../db/localOwnedRepo.ts";
import {DEFAULT_BG_KEY, DEFAULT_CARD_KEY, mergeShopItem, registerShopIcons, ShopEntry} from "../../data/shopVisuals.ts";
import {playSfx} from "../../utils/sfx.ts";
import {haptic} from "../../utils/haptics.ts";
import ScreenStatusBar from "../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";
import {ShopSkeleton} from "../../components/ui/Shimmer/Skeletons.tsx";
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

const TABS: TabType[] = ['card', 'background'];

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
    const coins = useGlobalStore(s => s.coins);
    const adsEnabled = useConfigStore(s => s.adsEnabled);
    const patchStats = useAuthStore(s => s.patchStats);

    const [activeTab, setActiveTab] = useState<TabType>('card');
    // Tabs whose grid has been built at least once — see switchTab.
    const [mountedTabs, setMountedTabs] = useState<Set<TabType>>(() => new Set<TabType>(['card']));
    const [showAdModal, setShowAdModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const [cardItems, setCardItems] = useState<ShopEntry[]>([]);
    const [bgItems, setBgItems] = useState<ShopEntry[]>([]);
    const [ownedKeys, setOwnedKeys] = useState<Set<string>>(new Set());
    const [activeCardKey, setActiveCardKey] = useState<string>(DEFAULT_CARD_KEY);
    const [activeBgKey, setActiveBgKey] = useState<string>(DEFAULT_BG_KEY);

    const tabAnim = useRef(new Animated.Value(0)).current;
    // Measured so the indicator can slide on a transform instead of a percentage.
    const [tabRowWidth, setTabRowWidth] = useState(0);

    // The native push animation can't start until this screen's first commit
    // lands, so whatever is mounted in that commit is dead time between the tap
    // on the menu and the screen moving at all. Same trick switchTab already
    // uses for a tab's grid, applied to opening the screen: the shell (header)
    // commits immediately, the push starts, and the tabs + skeleton mount on
    // the next frame while the screen is still off the right edge. loadShop()
    // is *not* deferred — it goes out on the first commit, so the items arrive
    // no later than before.
    const [contentReady, setContentReady] = useState(false);
    React.useEffect(() => {
        const raf = requestAnimationFrame(() => setContentReady(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Free starter items count as owned even before they hit the inventory table.
    function isOwned(entry: ShopEntry) {
        return ownedKeys.has(entry.key) || entry.priceCoins === 0;
    }

    async function loadShop() {
        try {
            const [items, inventory, localOwned] = await Promise.all([
                shopService.getItems(),
                shopService.getInventory(),
                localOwnedRepo.loadLocalOwned(),
            ]);

            registerShopIcons(items);
            const merged = items.map(mergeShopItem);

            // The server inventory is the source of truth. `localOwned` is the
            // legacy set from builds where daily-challenge coins never reached
            // the backend, so those purchases only ever existed on-device —
            // unioned in so upgrading players don't lose them. Nothing writes to
            // it any more (see localOwnedRepo).
            const owned = new Set([...inventory.map(e => e.item.key), ...localOwned]);
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
        if (tab === activeTab) return;

        // Deferred off the press's critical path: both are synchronous native
        // calls, and firing them inline delays the commit of the switch itself —
        // exactly the frame the player is watching.
        // Pitched up and quiet: navigation, not selection.
        setTimeout(() => {
            playSfx('equip', {rate: 1.18, volume: 0.7});
            haptic('equip');
        }, 0);

        setActiveTab(tab);

        // First visit to a tab builds its grid; after that both stay mounted and
        // switching is just a visibility flip. Lazy rather than mounting both up
        // front so opening the shop doesn't pay for a tab nobody looked at.
        //
        // The build is deferred to after the transition rather than done in this
        // same commit. That is what lets the shimmer actually show: the tab flips
        // instantly to a cheap skeleton, the indicator slides, and only then does
        // the expensive part happen — twenty cards' worth of SVG art, previews
        // and six animations each. Doing it inline meant the tap simply hung
        // until the whole grid was ready.
        if (!mountedTabs.has(tab)) {
            InteractionManager.runAfterInteractions(() => {
                setMountedTabs(prev => (prev.has(tab) ? prev : new Set(prev).add(tab)));
            });
        }
        Animated.spring(tabAnim, {
            toValue: tab === 'card' ? 0 : 1,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }

    async function equip(entry: ShopEntry) {
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
        // Mirror the equip to the backend so it persists server-side (fresh
        // installs, other devices). Best-effort: equipping stays instant and
        // offline-friendly — Realm is the local source of truth; this just syncs.
        try {
            await shopService.setActiveItem(entry.key);
        } catch {
            // Offline, or the server doesn't see it as owned yet — the local
            // equip still stands and will re-sync next time.
        }
    }

    // "You can't do that" — the two rejections a shop has (locked teaser, not
    // enough coins) and the failure path all land here, so they feel identical.
    function denyFeedback() {
        // Deferred like switchTab's: a rejection fires straight off a press, on
        // a screen holding a grid of animated cards, so the native calls stay
        // off the frame the player is watching.
        setTimeout(() => {
            playSfx('denied');
            haptic('denied');
        }, 0);
    }

    async function handleItemPress(entry: ShopEntry) {
        // Teasers are locked — visible but not purchasable/equippable.
        if (entry.comingSoon) return denyFeedback();
        if (busyKey) return;
        if (!isOwned(entry) && coins < entry.priceCoins) return denyFeedback();

        setBusyKey(entry.key);
        try {
            if (isOwned(entry)) {
                // Already owned (or free) — just equip it. The sound fires before
                // the await: equipping writes to Realm and syncs to the server,
                // and feedback that waits on either would lag behind the finger.
                setTimeout(() => { playSfx('equip'); haptic('equip'); }, 0);
                await equip(entry);
            } else {
                // Daily-challenge rewards are claimed on-device and credited to
                // the server in the background. Settle anything still queued
                // before spending, or the server sees a smaller balance than the
                // one the player is looking at and refuses a purchase they can
                // genuinely afford.
                await useDailyChallengesStore.getState().flushPending();

                // Buy, then equip — matches the previous one-tap behaviour. This
                // one DOES wait for the server: a ka-ching before the purchase
                // confirms would be a lie if it then fails.
                const result = await shopService.purchaseItem(entry.key);
                setOwnedKeys(prev => new Set(prev).add(entry.key));
                patchStats({coins: result.remainingCoins});
                playSfx('purchase');
                haptic('purchase');
                await equip(entry);
            }
        } catch (error) {
            console.error('Shop action failed:', error);
            denyFeedback();
            // Re-sync from the server so the UI reflects the real state.
            loadShop();
        } finally {
            setBusyKey(null);
        }
    }

    // Stable identity for the memoized ShopItem rows — the ref keeps the live
    // handleItemPress closure (busyKey lock, coins gate, ownedKeys) while
    // onItemPress itself never changes, so cards don't re-render on every tap.
    const handleItemPressRef = useRef(handleItemPress);
    handleItemPressRef.current = handleItemPress;
    const onItemPress = useCallback((entry: ShopEntry) => handleItemPressRef.current(entry), []);

    // translateX off a measured width rather than a `left: '0%' → '50%'`
    // interpolation: percentage `left` is a layout prop, which the native driver
    // can't touch, so the indicator's spring ran on the JS thread — the same one
    // that was busy mounting the incoming grid. As a transform it runs on the UI
    // thread and slides smoothly no matter what JS is doing.
    const tabIndicatorX = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabRowWidth / 2],
    });

    // Both lists are pre-sorted at load time (see loadShop) and intentionally
    // NOT re-sorted when the active key changes — equipping updates the
    // "Equipped" badge but keeps the list order stable under the player's
    // finger. They re-sort on the next focus.

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE_DARK, PURPLE_DARK, PURPLE]}
            style={styles.container}
        >
            <ScreenStatusBar/>

            <View style={{paddingHorizontal: HORIZONAL_OFFSET, marginBottom: 15}}>
                <BackHeader
                    title={`🛒 ${t('shop')}`}
                    isShowCoin={true}
                    textStyle={{marginRight: 25}}
                    coins={coins}
                    onCoinPress={adsEnabled ? () => setShowAdModal(true) : undefined}
                />
            </View>

            {contentReady && <>
            {/* Tabs */}
            <View style={styles.tabRow} onLayout={e => setTabRowWidth(e.nativeEvent.layout.width)}>
                <Animated.View
                    style={[
                        styles.tab,
                        styles.tabActive,
                        {
                            position: 'absolute',
                            width: '50%',
                            height: '100%',
                            left: 0,
                            transform: [{translateX: tabIndicatorX}],
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
                <ShopSkeleton/>
            ) : (
                // Both grids stay mounted once visited and the inactive one is
                // hidden, instead of one keyed ScrollView that tore the whole
                // list down and rebuilt it on every switch. Each ShopItem starts
                // six animations on mount (badge spin/pulse, a staggered
                // entrance delayed by index × 70ms, glow, shine, float) and
                // renders SVG art, so remounting a full grid was the lag.
                (TABS.map(tab => {
                    const isPending = !mountedTabs.has(tab);
                    if (isPending) {
                        // Not built yet. If it's the tab the player just moved
                        // to, this is the shimmer they see while the grid is
                        // assembled behind it (see switchTab); an unvisited tab
                        // that isn't showing renders nothing at all.
                        return tab === activeTab ? <ShopSkeleton key={tab}/> : null;
                    }

                    const list = tab === 'card' ? cardItems : bgItems;
                    const equipped = tab === 'card' ? activeCardKey : activeBgKey;
                    const isActive = tab === activeTab;

                    return (
                        <ScrollView
                            key={tab}
                            style={isActive ? styles.pane : styles.paneHidden}
                            contentContainerStyle={{paddingBottom: 30, marginTop: 20, paddingHorizontal: HORIZONAL_OFFSET}}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.grid}>
                                {list.map((item, index) => (
                                    <ShopItem
                                        key={item.id}
                                        index={index}
                                        selected={item.key === equipped}
                                        purchased={isOwned(item)}
                                        disabled={!isOwned(item) && coins < item.priceCoins}
                                        handlePress={onItemPress}
                                        item={item}
                                        paused={!isActive}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    );
                }))
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
            </>}
        </LinearGradient>
    );
}

export default Shop;
