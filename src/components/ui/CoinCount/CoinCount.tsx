import React, {useEffect, useRef} from "react";
import {Animated, Easing, Text, View, StyleProp, TouchableOpacity} from "react-native";
import LinearGradient from "react-native-linear-gradient";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './CoinCount.style.ts';

interface CoinCountProps {
    count?: number;
    viewStyles?: StyleProp<any>;
    onPress?: () => void;
}

function CoinCount({count, viewStyles, onPress}: CoinCountProps) {
    // The pill only earns a "+" when it actually leads somewhere: Home and Shop
    // hand over a handler only while ads are enabled, and Play never does. So
    // the badge follows onPress rather than a flag every caller would have to
    // thread through (BackHeader would need one purely to pass it along).
    const canAdd = !!onPress;

    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!canAdd) return;
        // Depends on canAdd, not onPress — Home builds its handler inline, so a
        // new identity arrives on every render and the loop would restart with it.
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(pulse, {toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
            Animated.timing(pulse, {toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        ]));
        loop.start();
        return () => loop.stop();
    }, [canAdd, pulse]);

    // A breath rather than a swell: the badge sits on the coin, so anything
    // larger would swallow the artwork it's pinned to.
    const badgeScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.15]});

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.75 : 1}
            style={[styles.container, viewStyles && viewStyles]}
            accessible={true}
            accessibilityRole={onPress ? 'button' : 'text'}
            accessibilityLabel={`${count} coins`}
        >
            <View style={styles.coinWrap}>
                <Coin width={22} height={20}/>

                {canAdd && (
                    <Animated.View
                        style={[styles.addBadge, {transform: [{scale: badgeScale}]}]}
                        pointerEvents="none"
                    >
                        <LinearGradient
                            colors={['#FFF0A8', '#FFD700', '#FFA000']}
                            start={{x: 0.15, y: 0}}
                            end={{x: 0.85, y: 1}}
                            style={styles.addFill}
                        >
                            <Text allowFontScaling={false} style={styles.addSign}>+</Text>
                        </LinearGradient>
                    </Animated.View>
                )}
            </View>

            <Text allowFontScaling={false} style={styles.text}>{count}</Text>
        </TouchableOpacity>
    );
}

// Memoised: Play re-renders on every animation frame, and this subtree does
// not change with it.
export default React.memo(CoinCount);
