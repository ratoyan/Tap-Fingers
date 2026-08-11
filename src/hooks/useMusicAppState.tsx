import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const useMusicAppState = (playMusic: any, pauseMusic: any, onBackground?: () => void) => {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            const wasActive = appState.current === 'active';
            const isActive  = nextState === 'active';

            // active -> inactive/background: the game lost the foreground.
            // iOS routes the app switcher, Control/Notification Centre and
            // incoming calls through 'inactive' and often never reaches
            // 'background', so we pause on the first step away from active
            // rather than waiting for 'background' — otherwise the menu never
            // opens on iOS. The first transition wins; the follow-up
            // inactive -> background no longer sees wasActive, so it won't
            // fire twice.
            if (wasActive && !isActive) {
                pauseMusic();
                onBackground?.();
            }

            // inactive/background -> active: back in the foreground.
            if (!wasActive && isActive) {
                playMusic();
            }

            appState.current = nextState;
        });

        return () => subscription.remove();
    }, [playMusic, pauseMusic, onBackground]);
};

export default useMusicAppState;