import React from 'react';
import {StatusBar} from 'react-native';

// The status bar is transparent everywhere in the app: each screen's own
// background — gradient, image or animated — runs all the way to the top of the
// display instead of being cut off by a painted bar. Every background here is
// dark, so the icons are always light-on-dark.
//
// There is nothing to configure per screen, which is the point: one component,
// no props, dropped at the top of each screen's tree.
//
// Notes on the two platforms, since they behave differently:
//
//  • On iOS the status bar has no background of its own anyway — the screen
//    already ran underneath it. Info.plist sets
//    UIViewControllerBasedStatusBarAppearance=false, so barStyle applies
//    app-wide from here rather than per view controller.
//
//  • On Android `translucent` is what moves the window behind the bar, and
//    backgroundColor must still be set explicitly: RN's StatusBar merges props
//    across mounted instances, so leaving it unset would let a screen inherit
//    whatever the one below it last painted.
//
// This only works because every screen offsets its top row by the safe-area
// inset — Home, Play, Level, Progress and BackHeader all position from
// insets.top, and Welcome reads StatusBar.currentHeight directly. A new screen
// that pins something to the top without doing that will render it under the
// clock.

function ScreenStatusBar() {
    return (
        <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent={true}
            animated={true}
        />
    );
}

export default React.memo(ScreenStatusBar);
