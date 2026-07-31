import React, {useRef} from 'react';
import {Animated, StyleProp, TouchableOpacity, ViewStyle} from 'react-native';

// ── PressScale ──────────────────────────────────────────────────────────────
// A touchable that dips under the finger and springs back on release — the same
// feel LuckyWheelButton has, pulled out so the rest of the app can share it
// instead of re-declaring two Animated.spring calls per button.
//
// The scale lives on an outer Animated.View rather than on the touchable so the
// transform never fights whatever layout style the caller passes in, and it runs
// on the native driver so a busy JS thread (an upload, a profile refresh) can't
// make the press feel mushy.

interface PressScaleProps {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    /** Visual style for the pressable box itself (padding, radius, background). */
    style?: StyleProp<ViewStyle>;
    /**
     * Layout style for the animated wrapper. Pass `alignSelf: 'stretch'` when the
     * parent centres its children (a wrapper hugs its content, so a child sized
     * at '100%' would otherwise measure against nothing).
     */
    wrapperStyle?: StyleProp<ViewStyle>;
    /** How far it dips. 0.95 for cards and wide buttons, less for small targets. */
    scaleTo?: number;
    activeOpacity?: number;
    hitSlop?: {top?: number; bottom?: number; left?: number; right?: number};
    accessibilityLabel?: string;
    accessibilityRole?: 'button' | 'image' | 'text';
}

function PressScale({
    children,
    onPress,
    disabled = false,
    style,
    wrapperStyle,
    scaleTo = 0.95,
    activeOpacity = 0.85,
    hitSlop,
    accessibilityLabel,
    accessibilityRole = 'button',
}: PressScaleProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const dip = () =>
        Animated.spring(scale, {toValue: scaleTo, friction: 7, tension: 220, useNativeDriver: true}).start();
    const lift = () =>
        Animated.spring(scale, {toValue: 1, friction: 4, tension: 140, useNativeDriver: true}).start();

    return (
        <Animated.View style={[wrapperStyle, {transform: [{scale}]}]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={dip}
                onPressOut={lift}
                disabled={disabled}
                activeOpacity={activeOpacity}
                hitSlop={hitSlop}
                style={style}
                accessible={true}
                accessibilityRole={accessibilityRole}
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{disabled}}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default React.memo(PressScale);
