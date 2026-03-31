import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const useMusicAppState = (playMusic: any, pauseMusic: any) => {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {

            // active -> background
            if (appState.current === 'active' && nextState === 'background') {
                pauseMusic();
            }

            // background -> active
            if (appState.current === 'background' && nextState === 'active') {
                playMusic();
            }

            appState.current = nextState;
        });

        return () => subscription.remove();
    }, [playMusic, pauseMusic]);
};

export default useMusicAppState;