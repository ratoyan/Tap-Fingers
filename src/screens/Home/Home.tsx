import React, {useCallback, useState} from 'react';
import {BackHandler, Platform, ScrollView, Text, TouchableOpacity, View} from "react-native";
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
import * as userService from "../../services/userService.ts";
import {LuckyWheelSegment} from "../../services/types.ts";
import {storage} from "../../db/kvStore.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import InAppReview from 'react-native-in-app-review';

// components
import MenuButton from "../../components/ui/MenuButton/MenuButton.tsx";
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import Logo from "../../components/ui/Logo/Logo.tsx";
import LuckyWheelModal from "../../components/ui/LuckyWheel/LuckyWheelModal.tsx";
import LuckyWheelButton from "../../components/ui/LuckyWheelButton/LuckyWheelButton.tsx";
import WatchAdModal from "../../components/ui/WatchAdModal/WatchAdModal.tsx";
import ExitModal from "../../components/ui/Play/ExitModal.tsx";

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
    // Wheel layout, prefetched here so the modal opens with its prizes already
    // drawn. null = still loading, [] = loaded but unusable.
    const [wheelSegments, setWheelSegments] = useState<LuckyWheelSegment[] | null>(null);
    const [wheelLoadError, setWheelLoadError] = useState(false);
    const [showAdModal, setShowAdModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const checkCanSpin = useCallback(async () => {
        const raw = await storage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        if (!raw) { setCanSpin(true); return; }
        const last = new Date(raw);
        const now = new Date();
        setCanSpin(
            last.getFullYear() !== now.getFullYear() ||
            last.getMonth() !== now.getMonth() ||
            last.getDate() !== now.getDate()
        );
    }, []);

    useFocusEffect(
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

    useFocusEffect(useCallback(() => { checkCanSpin(); }, [checkCanSpin]));

    // Prefetch the wheel layout on every Home focus. It used to be fetched when
    // the modal opened, which put a network round-trip between the player's tap
    // and a usable wheel — they got a grey disc and the word "loading". Doing it
    // here still picks up admin edits without an app restart (the reason it was
    // re-fetched per open), just before the player asks rather than after.
    //
    // Guarded against a late response landing after the player has navigated
    // away: without the flag this would setState on an unmounted screen every
    // time someone opened Home and left again inside the request window.
    useFocusEffect(useCallback(() => {
        let active = true;
        userService.getLuckyWheelSegments()
            .then(segments => {
                if (!active) return;
                setWheelSegments(segments);
                setWheelLoadError(false);
            })
            .catch(() => {
                if (!active) return;
                setWheelSegments([]);
                setWheelLoadError(true);
            });
        return () => { active = false; };
    }, []));

    // Re-pull the admin global config (ad switch / level length) on every Home
    // focus so an admin toggle reflects without a full app restart.
    useFocusEffect(useCallback(() => { syncGlobalConfig(); }, []));

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
    useFocusEffect(
        useCallback(() => {
            const now = Date.now();
            if (now - lastProfileRefresh < PROFILE_REFRESH_MS) return;
            lastProfileRefresh = now;
            refreshProfile().catch(() => {
                // Offline / transient error — keep showing the last known state,
                // and let the next focus retry right away.
                lastProfileRefresh = 0;
            });
        }, [refreshProfile])
    );

    useFocusEffect(
        useCallback(() => {
            const requestReviewIfNeeded = async () => {
                if (!InAppReview.isAvailable()) return;
                const raw = await storage.getItem(STORAGE_KEYS.LAST_REVIEW_DATE);
                const now = new Date();
                if (raw) {
                    const last = new Date(raw);
                    const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays < 3) return;
                }
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
            accessibilityLabel="Main menu screen"
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
                    scales on small phones and tablets alike. */}
                <Logo viewStyles={styles.logo}/>

                <View accessible={true} accessibilityLabel="Main menu options">
                    {menus.map((menu: MenuType, index: number) => (
                        <MenuButton menu={menu} key={index}/>
                    ))}
                </View>

                {/* Account hints live *below* the menu so they never shift the
                    buttons around. Guest with no email → create an account;
                    email pending confirmation → confirm it. Both go to Profile,
                    which is otherwise buried in Settings. */}
                {isGuestNoEmail && (
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
                )}

                {needsEmailVerify && (
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
                )}

            </ScrollView>

            <CoinCount
                count={coins}
                viewStyles={[globalStyles.coinView, {top: insets.top + TOP_OFFSET}]}
                onPress={adsEnabled ? () => setShowAdModal(true) : undefined}
            />

            <LuckyWheelButton
                canSpin={canSpin}
                top={insets.top + TOP_OFFSET + 5}
                onPress={() => setShowWheel(true)}
            />

            <LuckyWheelModal
                visible={showWheel}
                onClose={() => setShowWheel(false)}
                onSpinComplete={() => setCanSpin(false)}
                segments={wheelSegments}
                loadError={wheelLoadError}
            />

            <WatchAdModal
                visible={showAdModal}
                onCollect={async () => {
                    try {
                        // Server grants the coins and enforces the daily ad cap.
                        const result = await userService.claimAdReward();
                        patchStats({coins: result.totalCoins});
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
