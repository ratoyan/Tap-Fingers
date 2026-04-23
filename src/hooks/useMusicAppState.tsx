import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const useMusicAppState = (playMusic: any, pauseMusic: any, onBackground?: () => void) => {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {

            // active -> background
            if (appState.current === 'active' && nextState === 'background') {
                pauseMusic();
                onBackground?.();
            }

            // background -> active
            if (appState.current === 'background' && nextState === 'active') {
                playMusic();
            }

            appState.current = nextState;
        });

        return () => subscription.remove();
    }, [playMusic, pauseMusic, onBackground]);
};

export default useMusicAppState;