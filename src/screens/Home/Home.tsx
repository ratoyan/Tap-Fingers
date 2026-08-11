import React, {useCallback, useRef, useState} from 'react';
import {BackHandler, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/RootStackParamList';
import {MenuType} from "../../types/menu.type.ts";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {menus} from "../../data/menu.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {vs} from "../../utils/responsive.ts";
import {useGlobalStore} from "../../store/globalStore.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {useConfigStore} from "../../store/configStore.ts";
import {syncGlobalConfig} from "../../services/configSync.ts";
import {pushCoins} from "../../services/coinSync.ts";
import * as userService from "../../services/userService.ts";
import {LuckyWheelSegment} from "../../services/types.ts";
import {storage} from "../../db/kvStore.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import InAppReview from 'react-native-in-app-review';
import {useDeferredFocusEffect} from "../../hooks/useDeferredFocusEffect.ts";

// components
import MenuButton, {MENU_ENTER_LEAD, MENU_ENTER_STAGGER} from "../../components/ui/MenuButton/MenuButton.tsx";
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import Logo from "../../components/ui/Logo/Logo.tsx";
import LuckyWheelModal from "../../components/ui/LuckyWheel/LuckyWheelModal.tsx";
import LuckyWheelButton from "../../components/ui/LuckyWheelButton/LuckyWheelButton.tsx";
import WatchAdModal from "../../components/ui/WatchAdModal/WatchAdModal.tsx";
import CoinGain from "../../components/ui/CoinGain/CoinGain.tsx";
import ExitModal from "../../components/ui/Play/ExitModal.tsx";
import Entrance from "../../components/ui/Entrance/Entrance.tsx";

// styles
import styles from './Home.style.ts';
import globalStyles from '../../styles/globalStyle.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import ScreenStatusBar from "../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx";
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Throttle the focus-driven profile reconcile so rapid Home re-entries (after
// every round / shop visit / profile peek) don't spam GET /player/profile.
// Module-level so it survives remounts; 30s is well under any window where a
// stale balance would matter, and optimistic patchStats keeps coins/gems live
// in between.
const PROFILE_REFRESH_MS = 30_000;
let lastProfileRefresh = 0;

// The account hints bring up the rear: they wait for the last menu button to
// have been dealt, so the eye isn't pulled below the menu mid-arrival. Derived
// from MenuButton's own timings so the two can't drift apart.
const HINT_DELAY = MENU_ENTER_LEAD + menus.length * MENU_ENTER_STAGGER + 120;

const Home: React.FC<Props> = () => {
    const insets = useSafeAreaInsets();
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const coins = useGlobalStore(s => s.coins);
    const adsEnabled = useConfigStore(s => s.adsEnabled);
    const player = useAuthStore(s => s.player);
    // A guest with no email yet → prompt to create an account. A player with a
    // pending (unconfirmed) email → prompt to confirm it. A pending guest is
    // still accountType 'guest' but already has an email, so it shows the latter.
    const needsEmailVerify = !!player?.email && player?.emailVerified === false;
    const isGuestNoEmail = player?.accountType === 'guest' && !player?.email;
    const refreshProfile = useAuthStore(s => s.refreshProfile);
    const patchStats = useAuthStore(s => s.patchStats);
    const [showWheel, setShowWheel] = useState(false);
    const [canSpin, setCanSpin] = useState(false);
    // Seconds left of the wheel's 24h cooldown, as the server counted them. 0
    // while a spin is available; drives the modal's "next spin in" countdown.
    const [nextSpinInSeconds, setNextSpinInSeconds] = useState(0);
    // Wheel layout, prefetched here so the modal opens with its prizes already
    // drawn. null = still loading, [] = loaded but unusable.
    const [wheelSegments, setWheelSegments] = useState<LuckyWheelSegment[] | null>(null);
    // The latest layout, readable from callbacks without making them depend on
    // (and re-fire with) the state itself.
    const wheelSegmentsRef = useRef<LuckyWheelSegment[] | null>(null);
    wheelSegmentsRef.current = wheelSegments;
    const [wheelLoadError, setWheelLoadError] = useState(false);
    const [showAdModal, setShowAdModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    // Coins an ad just paid out, held only for as long as the "+N" pop plays.
    const [coinGain, setCoinGain] = useState<number | null>(null);
    // Offline fallback only. The server owns the cooldown (it enforces it on
    // POST /player/lucky-wheel either way); this device-local date is what we
    // fall back to when the state request doesn't land, and it is deliberately
    // permissive — a spin the server refuses just comes back as a 429.
    const checkCanSpinOffline = useCallback(async () => {
        const raw = await storage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        const last = raw ? new Date(raw).getTime() : NaN;
        // Never spun on this device, or an unreadable value — let them tap and
        // let the server decide.
        if (!Number.isFinite(last)) { setCanSpin(true); setNextSpinInSeconds(0); return; }
        const left = Math.max(
            0,
            Math.round(userService.SPIN_COOLDOWN_SECONDS - (Date.now() - last) / 1000),
        );
        setCanSpin(left === 0);
        setNextSpinInSeconds(left);
    }, []);

    // Pull the wheel layout + cooldown from the server. Shared by the focus
    // prefetch and by the modal's 429 path, where the device thought a spin was
    // available and the server disagreed — only it knows how long is left.
    const refreshWheelState = useCallback(async (isStale: () => boolean = () => false) => {
        try {
            const state = await userService.getLuckyWheel();
            if (isStale()) return;
            setWheelSegments(state.segments);
            setWheelLoadError(false);
            setCanSpin(state.canSpin);
            setNextSpinInSeconds(state.nextSpinInSeconds);
        } catch {
            if (isStale()) return;
            // Keep a layout we already have — a failed refresh (e.g. the one
            // after a 429, with the modal open) must not blank a working wheel.
            const known = wheelSegmentsRef.current;
            setWheelSegments(known ?? []);
            setWheelLoadError(!known || known.length === 0);
            // No verdict from the server — fall back to the device's own record
            // so the button isn't stuck dead while offline.
            checkCanSpinOffline();
        }
    }, [checkCanSpinOffline]);

    // Deferred, like everything else below: `new Sound(...)` opens and decodes
    // the mp3, and on a cold start the file isn't in the OS page cache yet — a
    // solid frame's worth of work, previously landing mid-entrance along with
    // playMusic's own 200ms timer.
    useDeferredFocusEffect(
        React.useCallback(() => {
            // This runs every time the screen is focused
            releaseMusic();

            loadMusic("gamemusic2.mp3");

            const timeout = setTimeout(() => {
                playMusic();
            }, 200);

            return () => {
                clearTimeout(timeout);
            };

        }, [])
    );

    // Prefetch the wheel layout AND the spin cooldown on every Home focus. It
    // used to be fetched when the modal opened, which put a network round-trip
    // between the player's tap and a usable wheel — they got a grey disc and the
    // word "loading". Doing it here still picks up admin edits without an app
    // restart (the reason it was re-fetched per open), just before the player
    // asks rather than after.
    //
    // Guarded against a late response landing after the player has navigated
    // away: without the flag this would setState on an unmounted screen every
    // time someone opened Home and left again inside the request window.
    useDeferredFocusEffect(useCallback(() => {
        let active = true;
        refreshWheelState(() => !active);
        return () => { active = false; };
    }, [refreshWheelState]));

    // Re-pull the admin global config (ad switch / level length) on every Home
    // focus so an admin toggle reflects without a full app restart.
    useDeferredFocusEffect(useCallback(() => { syncGlobalConfig(); }, []));

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS !== 'android') return;
            const sub = BackHandler.addEventListener('hardwareBackPress', () => {
                setShowExitModal(true);
                return true;
            });
            return () => sub.remove();
        }, [])
    );

    // Reconcile with the server-authoritative profile (coins, gems, equipped
    // card/bg) when the menu regains focus — but at most once per
    // PROFILE_REFRESH_MS. Firing on *every* focus hammered /player/profile each
    // time the player bounced back to Home; coins/gems already update
    // optimistically via patchStats, so this is just a periodic safety reconcile.
    //
    // The coin push goes FIRST and the reconcile waits for it. refreshProfile
    // overwrites the balance with the server's number, so a drifted local total
    // has to reach the backend before it's read back — the other order would
    // erase exactly the drift the push exists to carry. pushCoins never rejects
    // and no-ops when it isn't safe, so the reconcile runs either way.
    useDeferredFocusEffect(
        useCallback(() => {
            const now = Date.now();
            if (now - lastProfileRefresh < PROFILE_REFRESH_MS) return;
            lastProfileRefresh = now;
            pushCoins().then(refreshProfile).catch(() => {
                // Offline / transient error — keep showing the last known state,
                // and let the next focus retry right away.
                lastProfileRefresh = 0;
            });
        }, [refreshProfile])
    );

    useDeferredFocusEffect(
        useCallback(() => {
            const requestReviewIfNeeded = async () => {
                if (!InAppReview.isAvailable()) return;
                const raw = await storage.getItem(STORAGE_KEYS.LAST_REVIEW_DATE);
                const now = new Date();
                // First ever visit: only stamp the clock. Asking someone who has
                // not played a single round to rate the game is both a bad ask
                // and, because it spins up Play Services and a native dialog,
                // the single heaviest thing that used to happen on this screen —
                // and it happened exactly once, on the first entrance.
                if (!raw) {
                    await storage.setItem(STORAGE_KEYS.LAST_REVIEW_DATE, now.toISOString());
                    return;
                }
                const last = new Date(raw);
                const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays < 3) return;
                await storage.setItem(STORAGE_KEYS.LAST_REVIEW_DATE, now.toISOString());
                await InAppReview.RequestInAppReview().catch(() => {});
            };
            requestReviewIfNeeded();
        }, [])
    );

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
            accessible={true}
            accessibilityLabel={t('homeScreen')}
        >
            <ScreenStatusBar/>

            <ScrollView
                style={styles.scroll}
                // The safe-area/offset padding is *added* to the style's own top
                // padding rather than replacing it, so the centred block still
                // clears the coin counter and wheel button pinned up there when
                // the content is tall enough to reach them.
                contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + TOP_OFFSET + vs(10)}]}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* No fixed size — Logo derives one from the viewport so it
                    scales on small phones and tablets alike. The zoom starts a
                    whisker under 1 so it settles *into* the screen; any deeper
                    and the logo reads as being thrown at the player. */}
                <Entrance from="above" distance={16} scaleFrom={0.96} duration={640}>
                    <Logo viewStyles={styles.logo}/>
                </Entrance>

                {/* The buttons run their own arrival (fly-in from alternating
                    sides + icon pop + gloss sweep) off `index` — see
                    MenuButton. Nothing to wrap here. */}
                <View accessible={true} accessibilityLabel={t('homeMenuLabel')}>
                    {menus.map((menu: MenuType, index: number) => (
                        <MenuButton menu={menu} index={index} key={index}/>
                    ))}
                </View>

                {/* Account hints live *below* the menu so they never shift the
                    buttons around. Guest with no email → create an account;
                    email pending confirmation → confirm it. Both go to Profile,
                    which is otherwise buried in Settings. */}
                {isGuestNoEmail && (
                    <Entrance delay={HINT_DELAY} distance={12} duration={480}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.85}
                            style={accountHint.wrap}
                            accessibilityRole="button"
                            accessibilityLabel={t('createYourAccount')}
                        >
                            <Text allowFontScaling={false} style={accountHint.icon}>👻</Text>
                            <Text allowFontScaling={false} style={accountHint.label} numberOfLines={1}>
                                {t('createYourAccount')}
                            </Text>
                            <Text allowFontScaling={false} style={accountHint.arrow}>›</Text>
                        </TouchableOpacity>
                    </Entrance>
                )}

                {needsEmailVerify && (
                    <Entrance delay={HINT_DELAY} distance={12} duration={480}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.85}
                            style={[accountHint.wrap, verifyHint.wrap]}
                            accessibilityRole="button"
                            accessibilityLabel={t('confirmEmailBanner')}
                        >
                            <Text allowFontScaling={false} style={accountHint.icon}>📧</Text>
                            <Text allowFontScaling={false} style={accountHint.label} numberOfLines={1}>
                                {t('confirmEmailBanner')}
                            </Text>
                            <Text allowFontScaling={false} style={accountHint.arrow}>›</Text>
                        </TouchableOpacity>
                    </Entrance>
                )}

            </ScrollView>

            {/* The pill's absolute placement moves onto the wrapper — an
                Animated.View can't be positioned by a child's own style. */}
            <Entrance
                from="above"
                distance={18}
                duration={520}
                delay={50}
                style={[globalStyles.coinView, {top: insets.top + TOP_OFFSET}]}
            >
                <CoinCount
                    count={coins}
                    onPress={adsEnabled ? () => setShowAdModal(true) : undefined}
                />
            </Entrance>

            {/* A full-screen, touch-transparent layer: the wheel button pins
                itself absolutely, so it needs a parent that still spans the
                screen for its own top/left to mean what it did before. */}
            <Entrance
                from="left"
                distance={26}
                scaleFrom={0.94}
                duration={560}
                delay={120}
                style={StyleSheet.absoluteFill}
                pointerEvents="box-none"
            >
                <LuckyWheelButton
                    canSpin={canSpin}
                    top={insets.top + TOP_OFFSET + 5}
                    onPress={() => setShowWheel(true)}
                />
            </Entrance>

            <LuckyWheelModal
                visible={showWheel}
                onClose={() => setShowWheel(false)}
                onSpinComplete={seconds => {
                    setCanSpin(false);
                    setNextSpinInSeconds(seconds);
                }}
                onSpinRejected={() => {
                    // The server says the spin isn't ready (429) — the device
                    // thought otherwise. Trust the server, and re-pull the state
                    // for the real time left on the cooldown.
                    setCanSpin(false);
                    refreshWheelState();
                }}
                segments={wheelSegments}
                canSpin={canSpin}
                nextSpinInSeconds={nextSpinInSeconds}
                loadError={wheelLoadError}
            />

            {/* The reward the ad just paid, popping up under the coin pill. */}
            <CoinGain amount={coinGain} onDone={() => setCoinGain(null)} style={styles.coinGain} />

            <WatchAdModal
                visible={showAdModal}
                onCollect={async () => {
                    try {
                        // Server grants the coins and enforces the daily ad cap.
                        const result = await userService.claimAdReward();
                        patchStats({coins: result.totalCoins});
                        // Show what it actually paid: the amount is the server's
                        // to decide, so it's read off the response rather than
                        // repeating the "+10" the modal advertised.
                        setCoinGain(result.coinsEarned);
                    } catch {
                        // Daily limit reached or offline — leave the balance as-is.
                    }
                }}
                onClose={() => setShowAdModal(false)}
            />

            <ExitModal
                visible={showExitModal}
                onConfirm={() => BackHandler.exitApp()}
                onCancel={() => setShowExitModal(false)}
            />
        </LinearGradient>
    );
};

const accountHint = {
    wrap: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        alignSelf: 'center' as const,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginTop: 14,
        gap: 8,
    },
    icon: {fontSize: 16},
    label: {color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' as const},
    arrow: {color: 'rgba(255,255,255,0.55)', fontSize: 18, fontWeight: '700' as const},
};

const verifyHint = {
    wrap: {
        backgroundColor: 'rgba(247,151,30,0.14)',
        borderColor: 'rgba(247,151,30,0.45)',
    },
};

export default Home;
