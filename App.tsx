import React, {useEffect, useState} from 'react';
import {ActivityIndicator, AppState, Platform, View} from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
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

    const authStatus = useAuthStore(s => s.status);
    const bootstrap  = useAuthStore(s => s.bootstrap);

    // Restore any existing session from stored tokens while the splash plays.
    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    // The SFX pool is loaded for the app's lifetime rather than per screen: the
    // files are small (~370KB all told) and Settings, the pause menu and Play
    // all reach for the same voices. Loading it here also means the very first
    // tap of a round is already decoded instead of missing its sound.
    useEffect(() => {
        refreshSfxMuted().finally(loadSfx);
        // The haptics gate has nothing to preload — it just needs the persisted
        // vibration preference read once, before the first haptic() fires.
        refreshHapticsEnabled();
        // Initialize the AdMob SDK once for the app's lifetime. Rewarded ads
        // (the three "Watch Ad" buttons) load their own instance on demand.
        initAds();
    }, []);

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

    useEffect(() => {
        (async () => {
            try {
                const needsUpdate = await VersionCheck.needUpdate();
                if (needsUpdate?.isNeeded) {
                    if (needsUpdate.storeUrl) setStoreUrl(needsUpdate.storeUrl);
                    setShowUpdate(true);
                }
            } catch {}
        })();
    }, []);

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
        <View style={{flex: 1, backgroundColor: DARK_PURPLE}}>
            <NavigationContainer ref={navigationRef}>
                <StackNavigator initialRouteName={authStatus === 'authed' ? 'Home' : 'Welcome'}/>
                <UpdateModal visible={showUpdate} storeUrl={storeUrl}/>
                <NoticeModal/>
            </NavigationContainer>
            <BottomBanner/>
        </View>
    );
}

export default App;
