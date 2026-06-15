import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/RootStackParamList.ts';

// A navigation ref lets non-React code (e.g. the axios interceptor on an
// unrecoverable 401) drive navigation without a `navigation` prop.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Hard-resets the stack to the Welcome screen, discarding the back history so
// the signed-out user can't swipe/back into an authenticated screen.
export function resetToWelcome() {
    if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
}
