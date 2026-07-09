import {useCallback, useEffect, useRef, useState} from 'react';
import {Keyboard, Platform, ScrollView, StatusBar, TextInput} from 'react-native';

/**
 * Keeps the focused TextInput above the on-screen keyboard inside a ScrollView.
 *
 * Why this exists: the app targets Android SDK 36 on React Native 0.84, where
 * edge-to-edge is enabled by default. Under edge-to-edge the native
 * `adjustResize` soft-input mode no longer shrinks the RN view for the keyboard,
 * so Android stops auto-scrolling the focused field into view and inputs end up
 * hidden behind the keyboard. We fix it in JS:
 *
 *   1. Read the keyboard's top edge (`endCoordinates.screenY`, full-screen
 *      coordinates) from the Keyboard event, and compare it against the focused
 *      input's `measureInWindow` Y plus the status-bar inset (measureInWindow is
 *      window-relative, i.e. below the status bar, under edge-to-edge). Deriving
 *      the keyboard top from `Dimensions.height - keyboardHeight` is unreliable
 *      here because those coordinate spaces don't line up.
 *   2. Pad the bottom of the scroll content by the keyboard height so every
 *      field can be scrolled clear of the keyboard.
 *   3. Measure the focused input and, if it overlaps the keyboard, scroll just
 *      enough to reveal it.
 *
 * Usage:
 *   const {scrollRef, onScroll, onInputFocus, keyboardSpacerStyle} = useKeyboardAwareScroll();
 *   <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16}
 *               contentContainerStyle={[styles.content, keyboardSpacerStyle]} ...>
 *   <TextInput ... onFocus={onInputFocus} />
 */
export function useKeyboardAwareScroll(extraOffset = 48) {
    const scrollRef = useRef<ScrollView>(null);
    const scrollY = useRef(0);
    const keyboardTopRef = useRef(0); // screen-Y of the keyboard's top edge
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Scroll the currently-focused input clear of the keyboard, if it overlaps.
    const revealFocusedInput = useCallback(
        (keyboardTop: number) => {
            const focused = TextInput.State.currentlyFocusedInput?.();
            const scroller = scrollRef.current;
            if (!focused || !scroller || keyboardTop <= 0) {
                return;
            }
            // `keyboardTop` (endCoordinates.screenY) is in full-screen coordinates,
            // but under edge-to-edge measureInWindow reports Y relative to the
            // window, which starts below the status bar — so add that inset back
            // to bring both into the same space.
            const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
            focused.measureInWindow((_x: number, y: number, _w: number, h: number) => {
                const inputBottom = y + h + topInset;
                const overlap = inputBottom - (keyboardTop - extraOffset);
                if (overlap > 0) {
                    scroller.scrollTo({y: scrollY.current + overlap, animated: true});
                }
            });
        },
        [extraOffset],
    );

    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvt, e => {
            const end = e.endCoordinates;
            keyboardTopRef.current = end?.screenY ?? 0;
            setKeyboardHeight(end?.height ?? 0);
            // Wait for the bottom padding to apply before scrolling.
            setTimeout(() => revealFocusedInput(keyboardTopRef.current), 130);
        });
        const hideSub = Keyboard.addListener(hideEvt, () => {
            keyboardTopRef.current = 0;
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [revealFocusedInput]);

    const onScroll = useCallback((e: any) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
    }, []);

    // Re-reveal when moving between fields while the keyboard is already open.
    const onInputFocus = useCallback(() => {
        if (keyboardTopRef.current > 0) {
            setTimeout(() => revealFocusedInput(keyboardTopRef.current), 130);
        }
    }, [revealFocusedInput]);

    // Bottom spacing so the lowest fields can clear the keyboard. The keyboard
    // already overlaps the view (edge-to-edge), so we add the full height.
    const keyboardSpacerStyle = keyboardHeight > 0 ? {paddingBottom: keyboardHeight} : null;

    return {scrollRef, keyboardHeight, onScroll, onInputFocus, keyboardSpacerStyle};
}
