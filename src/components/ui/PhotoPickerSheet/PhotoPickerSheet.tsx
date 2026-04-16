import React, {useEffect, useRef} from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
    DARK_PURPLE,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    ORCHID,
    PLUM,
    PURPLE,
    WHITE,
} from '../../../constants/colors.ts';

interface PhotoPickerSheetProps {
    visible: boolean;
    onCamera: () => void;
    onGallery: () => void;
    onClose: () => void;
}

export default function PhotoPickerSheet({
    visible,
    onCamera,
    onGallery,
    onClose,
}: PhotoPickerSheetProps) {
    const {t} = useTranslation();
    const slideAnim = useRef(new Animated.Value(300)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 70,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, {opacity: backdropAnim}]} />
            </TouchableWithoutFeedback>

            {/* Sheet */}
            <Animated.View
                style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}
            >
                {/* Handle bar */}
                <View style={styles.handleBar} />

                <Text style={styles.title}>{t('changePhoto')}</Text>

                {/* Camera option */}
                <TouchableOpacity
                    onPress={onCamera}
                    activeOpacity={0.85}
                    style={styles.optionBtn}
                >
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.optionGradient}
                    >
                        <View style={styles.iconBubble}>
                            <Text style={styles.optionIcon}>📸</Text>
                        </View>
                        <Text style={styles.optionLabel}>{t('camera')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Gallery option */}
                <TouchableOpacity
                    onPress={onGallery}
                    activeOpacity={0.85}
                    style={styles.optionBtn}
                >
                    <LinearGradient
                        colors={['#8e44ad', '#6c3483']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.optionGradient}
                    >
                        <View style={styles.iconBubble}>
                            <Text style={styles.optionIcon}>🖼️</Text>
                        </View>
                        <Text style={styles.optionLabel}>{t('gallery')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: DARK_PURPLE,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 14,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: ORCHID,
        shadowOffset: {width: 0, height: -6},
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 20,
    },
    handleBar: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: PLUM,
        alignSelf: 'center',
        marginBottom: 20,
        opacity: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: WHITE,
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 0.3,
    },
    optionBtn: {
        borderRadius: 18,
        marginBottom: 12,
        overflow: 'hidden',
    },
    optionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 16,
    },
    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIcon: {
        fontSize: 22,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: WHITE,
        letterSpacing: 0.3,
    },
    cancelBtn: {
        marginTop: 4,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: PURPLE,
    },
    cancelText: {
        color: PLUM,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
