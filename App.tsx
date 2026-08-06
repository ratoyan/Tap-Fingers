import React, {useEffect, useState} from 'react';
import {ActivityIndicator, AppState, Platform, View} from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
import {SafeAreaProvider} from "react-native-safe-area-context";
// @ts-ignore
import VersionCheck from 'react-native-version-check';

import StackNavigator from "./src/navigation/StackNavigator.tsx";
import useMusicAppState from "./src/hooks/useMusicAppState.tsx";
import {playMusic, stopMusic} from "./src/utils/helpers.ts";
import {loadSfx, refreshSfxMuted} from "./src/utils/sfx.ts";
import {refreshHapticsEnabled} from "./src/utils/haptics.ts";
import {initAds} from "./src/utils/ads.ts";
import ScreenStatusBar from "./src/components/ui/ScreenStatusBar/ScreenStatusBar.tsx";
import UpdateModal from "./src/components/ui/UpdateModal/UpdateModal.tsx";
import NoticeModal from "./src/components/ui/NoticeModal/NoticeModal.tsx";
import Splash from "./src/screens/Splash/Splash.tsx";
import BottomBanner from "./src/components/ui/BottomBanner/BottomBanner.tsx";
import {useAuthStore} from "./src/store/authStore.ts";
import {useGlobalStore} from "./src/store/globalStore.ts";
import {useDailyChallengesStore} from "./src/store/dailyChallengesStore.ts";
import {syncGlobalConfig} from "./src/services/configSync.ts";
import {navigationRef} from "./src/navigation/navigationRef.ts";
import {DARK_PURPLE} from "./src/constants/colors.ts";

const STORE_URL = Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/idYOUR_APP_ID'
    : 'https://play.google.com/store/apps/details?id=com.tapfingers';

function App() {
    useMusicAppState(playMusic, stopMusic);
    const [splashDone, setSplashDone] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [storeUrl,   setStoreUrl]   = useState(STORE_URL);
    // Current route name, so the bottom banner can hide itself on Play.
    const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

    const authStatus = useAuthStore(s => s.status);
    const bootstrap  = useAuthStore(s => s.bootstrap);

    // Restore any existing session from stored tokens while the splash plays.
    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    // Load the device-local daily-challenge state and the coin bonus it feeds
    // once on startup. Order-independent of bootstrap: setCoins re-layers the
    // bonus on top of whatever server balance lands, so the two converge.
    useEffect(() => {
        useGlobalStore.getState().hydrateBonusCoins();
        useDailyChallengesStore.getState().hydrate();
    }, []);

    // Startup work that the first screen doesn't need is held back until the
    // splash has handed over. All three of these do their work on the MAIN
    // thread — the same thread the splash's native-driver animations write to
    // every frame — so running them under the splash was what made it stutter:
    // the AdMob SDK init does disk I/O and reflection there, and the SFX pool
    // is 20 MediaPlayer prepares (file open + codec each). The extra delay past
    // splashDone keeps them off the frame where the navigator mounts, which is
    // the other busy moment of startup.
    useEffect(() => {
        if (!splashDone) return;
        const timer = setTimeout(() => {
            // The SFX pool is loaded for the app's lifetime rather than per
            // screen: the files are small (~370KB all told) and Settings, the
            // pause menu and Play all reach for the same voices. Home is still
            // several taps away from a round, so it's decoded long before the
            // first tap needs it.
            refreshSfxMuted().finally(loadSfx);
            // The haptics gate has nothing to preload — it just needs the
            // persisted vibration preference read once, before the first
            // haptic() fires.
            refreshHapticsEnabled();
            // Initialize the AdMob SDK once for the app's lifetime. Rewarded ads
            // (the three "Watch Ad" buttons) load their own instance on demand.
            initAds();
        }, 600);
        return () => clearTimeout(timer);
    }, [splashDone]);

    // Pull the admin-controlled global config (ads on/off, level length) at
    // startup AND every time the app returns to the foreground, so an admin
    // toggle of the ad switch reaches an already-running app — not just on a
    // fresh launch. (Home also re-syncs on focus for in-session navigation.)
    useEffect(() => {
        syncGlobalConfig();
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active') syncGlobalConfig();
        });
        return () => sub.remove();
    }, []);

    // Also deferred past the splash: needUpdate() hits the store listing over
    // the network and reads the installed package info natively. The modal it
    // raises sits on top of the navigator, so nothing about it needs to be
    // resolved before the splash ends.
    useEffect(() => {
        if (!splashDone) return;
        let cancelled = false;
        (async () => {
            try {
                const needsUpdate = await VersionCheck.needUpdate();
                if (cancelled) return;
                if (needsUpdate?.isNeeded) {
                    if (needsUpdate.storeUrl) setStoreUrl(needsUpdate.storeUrl);
                    setShowUpdate(true);
                }
            } catch {}
        })();
        return () => { cancelled = true; };
    }, [splashDone]);

    const sessionResolved = authStatus === 'authed' || authStatus === 'unauthed';

    // Splash still animating — keep showing it.
    if (!splashDone) {
        return <Splash onFinish={() => setSplashDone(true)}/>;
    }

    // Splash finished but the session check is still in flight (slow network).
    if (!sessionResolved) {
        return (
            <View style={{flex: 1, backgroundColor: DARK_PURPLE, alignItems: 'center', justifyContent: 'center'}}>
                {/* This view sits between Splash and the first real screen, so
                    without its own bar the status bar would flash back to the
                    platform default for as long as the session check takes. */}
                <ScreenStatusBar/>
                <ActivityIndicator size="large" color="#FFD700"/>
            </View>
        );
    }

    return (
        // Column layout: the navigator fills the screen and BottomBanner sits
        // below it, so the banner never overlaps screen content — it reserves
        // its own strip at the very bottom (and collapses when there's no ad).
        <SafeAreaProvider>
            <View style={{flex: 1, backgroundColor: DARK_PURPLE}}>
                <NavigationContainer
                    ref={navigationRef}
                    onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                    onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                >
                    <StackNavigator initialRouteName={authStatus === 'authed' ? 'Home' : 'Welcome'}/>
                    <UpdateModal visible={showUpdate} storeUrl={storeUrl}/>
                    <NoticeModal/>
                </NavigationContainer>
                <BottomBanner currentRoute={currentRoute}/>
            </View>
        </SafeAreaProvider>
    );
}

export default App;
