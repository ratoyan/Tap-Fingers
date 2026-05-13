import React, {useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import InAppReview from 'react-native-in-app-review';
import {ms, vs} from '../../../utils/responsive.ts';

interface ReviewButtonProps {
    top: number;
}

export default function ReviewButton({top}: ReviewButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (InAppReview.isAvailable()) {
            InAppReview.RequestInAppReview();
        }
    };

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
                    onPress={handlePress}
                >
                    <View style={styles.outerRing}>
                        <LinearGradient
                            colors={['#2a0058', '#160030', '#0a0018']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.gradient}
                        >
                            <Text allowFontScaling={false} style={styles.emoji}>⭐</Text>
                            <View style={styles.divider}/>
                            <Text allowFontScaling={false} style={styles.label}>RATE</Text>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        right: ms(14),
        zIndex: 20,
        shadowColor: '#FFD700',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
    },
    outerRing: {
        borderRadius: ms(22),
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.6)',
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
        color: '#FFD700',
        fontSize: ms(9),
        fontWeight: '900',
        letterSpacing: ms(1.8),
    },
});
