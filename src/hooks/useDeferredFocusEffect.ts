import {useCallback} from 'react';
import {InteractionManager} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';

/**
 * `useFocusEffect`, but the body waits until the screen's entrance animation
 * has finished before it runs.
 *
 * Why this exists: a screen's focus effects all fire in the same tick as the
 * first paint. On Home that meant a cold audio load, three network round-trips
 * and (on a brand-new install) a native review dialog all landing on the JS
 * thread during the ~600ms the menu spends flying in. The animations are
 * native-driven, but their *stagger* is not: `Animated.sequence` chains each
 * step from JS, so a blocked JS thread stalls the choreography — the buttons
 * hang mid-flight and then snap into place. Every promise that resolves in that
 * window also re-renders the screen, which costs another commit.
 *
 * So the heavy work is queued behind InteractionManager instead. Animations
 * only register an interaction handle when they're *not* native-driven
 * (`__isInteraction = config.isInteraction ?? !useNativeDriver`), so the
 * entrance animations opt in explicitly with `isInteraction: true` — see
 * Entrance and MenuButton. Looping/idle animations must NOT do that, or the
 * queue would never drain.
 *
 * The entrances are mount-only, so this defers on the screen's first focus and
 * runs straight away on every later one — which is exactly right: there is no
 * animation left to protect once the screen is already sitting there.
 *
 * `maxWaitMs` is the backstop: if something holds a handle open (a long drag, an
 * animation that never lands), the work runs anyway rather than never.
 *
 * Pass a `useCallback`-wrapped effect, exactly like `useFocusEffect`.
 */
export function useDeferredFocusEffect(
    effect: () => void | (() => void),
    maxWaitMs = 1500,
) {
    useFocusEffect(
        useCallback(() => {
            let cleanup: void | (() => void);
            let started = false;
            let cancelled = false;

            const run = () => {
                if (started || cancelled) return;
                started = true;
                cleanup = effect();
            };

            const handle = InteractionManager.runAfterInteractions(run);
            const fallback = setTimeout(run, maxWaitMs);

            return () => {
                cancelled = true;
                handle.cancel();
                clearTimeout(fallback);
                cleanup?.();
            };
        }, [effect, maxWaitMs]),
    );
}

export default useDeferredFocusEffect;
