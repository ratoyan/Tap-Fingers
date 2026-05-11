import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ms, vs} from '../../../utils/responsive.ts';
import {GOLD} from '../../../constants/colors.ts';

interface LuckyWheelButtonProps {
    canSpin: boolean;
    top: number;
    onPress: () => void;
}

export default function LuckyWheelButton({canSpin, top, onPress}: LuckyWheelButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!canSpin) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {toValue: 1, duration: 900, useNativeDriver: false}),
                Animated.timing(glowAnim, {toValue: 0, duration: 900, useNativeDriver: false}),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [canSpin]);

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,215,0,0.5)', 'rgba(255,215,0,1)'],
    });

    return (
        <View style={[styles.wrapper, {top}]}>
            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={() =>
                        Animated.spring(scaleAnim, {toValue: 0.88, useNativeDriver: true}).start()
                    }
                    onPressOut={() =>
                        Animated.spring(scaleAnim, {toValue: 1, friction: 4, useNativeDriver: true}).start()
                    }
                    onPress={onPress}
                >
                    <Animated.View style={[styles.outerRing, {borderColor}]}>
                        <LinearGradient
                            colors={['#2a0058', '#160030', '#0a0018']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.gradient}
                        >
                            <Text allowFontScaling={false} style={styles.emoji}>🎡</Text>
                            <View style={styles.divider}/>
                            <Text allowFontScaling={false} style={styles.label}>SPIN</Text>
                        </LinearGradient>
                    </Animated.View>

                    {canSpin && (
                        <View style={styles.freeBadge}>
                            <Text allowFontScaling={false} style={styles.freeBadgeText}>FREE</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: ms(14),
        zIndex: 20,
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
    },
    outerRing: {
        borderRadius: ms(22),
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    gradient: {
        width: ms(72),
        paddingTop: vs(10),
        paddingBottom: vs(9),
        alignItems: 'center',
        gap: vs(4),
    },
    emoji: {
        fontSize: ms(32),
        lineHeight: ms(36),
    },
    divider: {
        width: '65%',
        height: 1,
        backgroundColor: 'rgba(255,215,0,0.3)',
    },
    label: {
        color: GOLD,
        fontSize: ms(9),
        fontWeight: '900',
        letterSpacing: ms(1.8),
    },
    freeBadge: {
        position: 'absolute',
        top: ms(-8),
        right: ms(-8),
        backgroundColor: '#e63000',
        borderRadius: ms(9),
        paddingHorizontal: ms(5),
        paddingVertical: vs(2),
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    freeBadgeText: {
        color: '#fff',
        fontSize: ms(8),
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
