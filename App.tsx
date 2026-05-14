import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
// @ts-ignore
import VersionCheck from 'react-native-version-check';

import StackNavigator from "./src/navigation/StackNavigator.tsx";
import useMusicAppState from "./src/hooks/useMusicAppState.tsx";
import {playMusic, stopMusic} from "./src/utils/helpers.ts";
import UpdateModal from "./src/components/ui/UpdateModal/UpdateModal.tsx";
import Splash from "./src/screens/Splash/Splash.tsx";
import {useAuthStore} from "./src/store/authStore.ts";
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
                <ActivityIndicator size="large" color="#FFD700"/>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StackNavigator initialRouteName={authStatus === 'authed' ? 'Home' : 'Welcome'}/>
            <UpdateModal visible={showUpdate} storeUrl={storeUrl}/>
        </NavigationContainer>
    );
}

export default App;
