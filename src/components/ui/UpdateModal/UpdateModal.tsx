import React, {useEffect, useRef} from 'react';
import {
    Animated,
    Easing,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {DARK_PURPLE, GOLD, PURPLE} from '../../../constants/colors.ts';

interface UpdateModalProps {
    visible: boolean;
    storeUrl: string;
}

export default function UpdateModal({visible, storeUrl}: UpdateModalProps) {
    const scaleAnim   = useRef(new Animated.Value(0.75)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim   = useRef(new Animated.Value(1)).current;
    const shineAnim   = useRef(new Animated.Value(-1)).current;
    const pulseRef    = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim,   {toValue: 1, friction: 5, tension: 70, useNativeDriver: true}),
                Animated.timing(opacityAnim, {toValue: 1, duration: 250, useNativeDriver: true}),
            ]).start();

            shineAnim.setValue(-1);
            Animated.loop(
                Animated.timing(shineAnim, {toValue: 2, duration: 2600, delay: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true})
            ).start();

            pulseRef.current = Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, {toValue: 1.06, duration: 700, useNativeDriver: true}),
                Animated.timing(pulseAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
            ]));
            pulseRef.current.start();
        } else {
            scaleAnim.setValue(0.75);
            opacityAnim.setValue(0);
            pulseRef.current?.stop();
            pulseAnim.setValue(1);
        }
    }, [visible]);

    const shineTranslate = shineAnim.interpolate({inputRange: [-1, 2], outputRange: [-300, 300]});

    function openStore() {
        Linking.openURL(storeUrl).catch(() => {});
    }

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => {}}>
            <Animated.View style={[styles.backdrop, {opacity: opacityAnim}]}>
                <Animated.View style={[styles.cardWrapper, {transform: [{scale: scaleAnim}]}]}>
                    <LinearGradient
                        colors={['#1e0040', '#0d0020', '#1a0038']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.card}
                    >
                        {/* Shine sweep */}
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.shine, {transform: [{translateX: shineTranslate}]}]}
                        />

                        {/* Icon */}
                        <View style={styles.iconRing}>
                            <Text allowFontScaling={false} style={styles.iconEmoji}>🚀</Text>
                        </View>

                        {/* Title */}
                        <Text allowFontScaling={false} style={styles.title}>New Update!</Text>
                        <View style={styles.divider}/>
                        <Text allowFontScaling={false} style={styles.subtitle}>
                            A new version of TapFingers is available. Update now for the latest features and improvements!
                        </Text>

                        {/* Update button */}
                        <Animated.View style={{transform: [{scale: pulseAnim}], width: '100%'}}>
                            <TouchableOpacity
                                onPress={openStore}
                                activeOpacity={0.85}
                                style={styles.updateBtn}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Play Store'}
                            >
                                <LinearGradient
                                    colors={['#FFE566', '#FFD700', '#cc8800']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.updateGradient}
                                >
                                    <Text allowFontScaling={false} style={styles.updateText}>
                                        {Platform.OS === 'ios' ? '🍎  Update on App Store' : '▶  Update on Play Store'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex:            1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        alignItems:      'center',
        justifyContent:  'center',
    },
    cardWrapper: {
        width:    '88%',
        maxWidth: 380,
    },
    card: {
        borderRadius:      28,
        paddingTop:        32,
        paddingBottom:     28,
        paddingHorizontal: 24,
        alignItems:        'center',
        borderWidth:       1.5,
        borderColor:       'rgba(255,215,0,0.35)',
        overflow:          'hidden',
    },
    shine: {
        position:        'absolute',
        top:             0,
        bottom:          0,
        width:           80,
        backgroundColor: 'rgba(255,255,255,0.045)',
        transform:       [{skewX: '-18deg'}],
    },
    iconRing: {
        width:           88,
        height:          88,
        borderRadius:    44,
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderWidth:     1.5,
        borderColor:     'rgba(255,215,0,0.4)',
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    18,
    },
    iconEmoji: {
        fontSize: 44,
    },
    title: {
        color:            GOLD,
        fontSize:         26,
        fontWeight:       '900',
        letterSpacing:    2,
        textShadowColor:  'rgba(255,160,0,0.8)',
        textShadowRadius: 14,
        marginBottom:     4,
    },
    divider: {
        width:           '50%',
        height:          1,
        backgroundColor: 'rgba(255,215,0,0.3)',
        marginVertical:  14,
    },
    subtitle: {
        color:        'rgba(255,255,255,0.65)',
        fontSize:     14,
        lineHeight:   22,
        textAlign:    'center',
        marginBottom: 28,
    },
    updateBtn: {
        borderRadius: 18,
        overflow:     'hidden',
    },
    updateGradient: {
        paddingVertical:   16,
        paddingHorizontal: 24,
        alignItems:        'center',
        borderRadius:      18,
    },
    updateText: {
        color:         '#1a0033',
        fontSize:      16,
        fontWeight:    '900',
        letterSpacing: 0.5,
    },
});
