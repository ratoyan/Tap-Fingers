import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleProp, StyleSheet, Text, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Coin from '../../../assets/icons/Coin.tsx';
import {playSfx} from '../../../utils/sfx.ts';
import {haptic} from '../../../utils/haptics.ts';
import {GOLD} from '../../../constants/colors.ts';
import {TOP_OFFSET} from '../../../constants/uiConstants.ts';
import {ms, vs} from '../../../utils/responsive.ts';

// ── CoinGain ────────────────────────────────────────────────────────────────
// The "+10" that pops up and drifts toward the coin pill after a reward lands.
// Rewarded ads used to pay out silently: the balance in the corner went up by
// ten while the player was still looking at where the ad had been, so the thing
// they'd watched an ad for was the one thing they didn't see happen.
//
// It floats UP into the pill rather than away from it, so the eye is carried to
// the number that just changed. Sound and haptic fire here, with the visible
// pop, rather than at the call site — the payoff should be one event, and every
// screen that grants coins gets the same one.
//
// Purely decorative and never interactive: it sits over the screen with
// pointerEvents="none" so it can't eat a tap on the pill underneath.

const RISE = vs(46);
const DURATION = 1500;

interface CoinGainProps {
    /** The amount to celebrate. null/0 renders nothing; set it to fire. */
    amount: number | null;
    /** Called once the pop has finished, so the parent can clear `amount`. */
    onDone: () => void;
    /** Extra dp below the standard header line, to sit under that screen's pill. */
    offsetY?: number;
    style?: StyleProp<ViewStyle>;
}

function CoinGain({amount, onDone, offsetY = 44, style}: CoinGainProps) {
    const insets = useSafeAreaInsets();
    const t = useRef(new Animated.Value(0)).current;
    // Callers pass an inline closure; keeping it in a ref means a parent
    // re-render can't restart the animation half-way through.
    const doneRef = useRef(onDone);
    doneRef.current = onDone;

    useEffect(() => {
        if (!amount) return;

        // 'claim' is the game's once-in-a-while reward cue — the same one the
        // lucky wheel pays out with (see utils/sfx.ts, utils/haptics.ts).
        playSfx('claim');
        haptic('claim');

        t.setValue(0);
        const anim = Animated.timing(t, {
            toValue: 1,
            duration: DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });
        anim.start(({finished}) => {
            if (finished) doneRef.current();
        });
        return () => anim.stop();
    }, [amount, t]);

    if (!amount) return null;

    const translateY = t.interpolate({inputRange: [0, 1], outputRange: [0, -RISE]});
    // In fast, hold, then fade — the number has to be readable well before it
    // starts leaving.
    const opacity = t.interpolate({
        inputRange: [0, 0.1, 0.62, 1],
        outputRange: [0, 1, 1, 0],
    });
    // Overshoots once on the way in so it lands with a little weight.
    const scale = t.interpolate({
        inputRange: [0, 0.16, 0.32, 1],
        outputRange: [0.6, 1.18, 1, 1],
    });

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`+${amount} coins`}
            style={[
                styles.pill,
                {top: insets.top + TOP_OFFSET + vs(offsetY)},
                style,
                {opacity, transform: [{translateY}, {scale}]},
            ]}
        >
            <Coin width={ms(19)} height={ms(17)} />
            <Text allowFontScaling={false} style={styles.amount}>+{amount}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    pill: {
        position: 'absolute',
        right: ms(12),
        zIndex: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(6),
        paddingHorizontal: ms(12),
        paddingVertical: vs(5),
        borderRadius: ms(999),
        backgroundColor: 'rgba(20,0,35,0.72)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.55)',
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 14,
        elevation: 12,
    },
    amount: {
        color: GOLD,
        fontSize: ms(18),
        fontWeight: '900',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(255,180,0,0.9)',
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 10,
    },
});

export default React.memo(CoinGain);
