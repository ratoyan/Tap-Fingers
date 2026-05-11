import React, {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
// @ts-ignore
import VersionCheck from 'react-native-version-check';

import StackNavigator from "./src/navigation/StackNavigator.tsx";
import useMusicAppState from "./src/hooks/useMusicAppState.tsx";
import {playMusic, stopMusic} from "./src/utils/helpers.ts";
import UpdateModal from "./src/components/ui/UpdateModal/UpdateModal.tsx";
import Splash from "./src/screens/Splash/Splash.tsx";

const STORE_URL = Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/idYOUR_APP_ID'
    : 'https://play.google.com/store/apps/details?id=com.tapfingers';

function App() {
    useMusicAppState(playMusic, stopMusic);
    const [splashDone, setSplashDone] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [storeUrl,   setStoreUrl]   = useState(STORE_URL);

    useEffect(() => {
        (async () => {
            try {
                const needsUpdate = await VersionCheck.needUpdate();
                if (needsUpdate?.isNeeded) {
                    if (needsUpdate.storeUrl) setStoreUrl(needsUpdate.storeUrl);
                    setShowUpdate(true);
                }
            } catch (_) {}
        })();
    }, []);

    return (
        <>
            <NavigationContainer>
                <StackNavigator/>
                <UpdateModal visible={showUpdate} storeUrl={storeUrl}/>
            </NavigationContainer>
            {!splashDone && <Splash onFinish={() => setSplashDone(true)}/>}
        </>
    );
}

export default App;
