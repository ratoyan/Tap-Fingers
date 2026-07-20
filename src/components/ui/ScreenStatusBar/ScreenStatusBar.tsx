import React from 'react';
import {StatusBar} from 'react-native';

// Every screen in the app is a dark purple gradient, so the status bar is always
// light-on-dark. That decision lives here rather than being repeated at nine
// call sites — screens only say which colour they start with at the top.
//
// Notes on the two platforms, since they behave differently:
//
//  • backgroundColor is Android-only. On iOS the status bar has no background of
//    its own; the screen's gradient simply runs underneath it, which is what we
//    want. Info.plist sets UIViewControllerBasedStatusBarAppearance=false, so
//    barStyle applies app-wide from here instead of per view controller.
//
//  • translucent defaults to false. With it on, Android draws the screen behind
//    the bar, and every element pinned to the top of that screen has to add
//    insets.top itself or it ends up underneath the clock. Only pass it on
//    screens that already position their top row from useSafeAreaInsets().
//
// RN's StatusBar is last-mounted-wins, so a stack push picks up the new screen's
// colour and a pop restores the previous one with no extra bookkeeping.

interface ScreenStatusBarProps {
    /**
     * The colour at the very top of the screen — usually the gradient's first
     * stop. Ignored when `translucent`, where the bar has no fill of its own.
     */
    color?: string;
    /**
     * Let the screen's own background show through the bar instead of painting
     * it. Requires the screen's top-most elements to be offset by insets.top.
     */
    translucent?: boolean;
}

function ScreenStatusBar({color, translucent = false}: ScreenStatusBarProps) {
    return (
        <StatusBar
            barStyle="light-content"
            // 'transparent' rather than leaving it unset: StatusBar merges props
            // across mounted instances, so without an explicit value a screen
            // pushed on top of an opaque one would inherit that screen's colour
            // and the bar would stay filled.
            backgroundColor={translucent ? 'transparent' : color}
            translucent={translucent}
            animated={true}
        />
    );
}

export default React.memo(ScreenStatusBar);
