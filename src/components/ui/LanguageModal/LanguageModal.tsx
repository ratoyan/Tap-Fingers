import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {languages} from '../../../data/language.ts';
import {useTranslation} from 'react-i18next';
import styles from './LanguageModal.style';

const LANG_META: Record<string, {flag: string; native: string}> = {
    am: {flag: '🇦🇲', native: 'Հայերեն'},
    ru: {flag: '🇷🇺', native: 'Русский'},
    en: {flag: '🇬🇧', native: 'English'},
};

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (val: any) => void;
    selectedLanguage?: string;
}

function LanguageModal({visible, onClose, onSelect, selectedLanguage}: LanguageModalProps) {
    const {t} = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.85);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 60, useNativeDriver: true}),
                Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Pressable style={styles.overlay} onPress={onClose} accessible={false}>
            <Animated.View style={[styles.card, {transform: [{scale: scaleAnim}], opacity: fadeAnim}]}>

                {/* Title */}
                <Text allowFontScaling={false} style={styles.title}>
                    🌐  {t('selectLanguage')}
                </Text>

                <View style={styles.divider}/>

                {/* Language items */}
                {languages.map((lang, index) => {
                    const meta = LANG_META[lang.code] ?? {flag: '🌍', native: lang.name};
                    const isSelected = selectedLanguage === lang.name;

                    return (
                        <TouchableOpacity
                            key={lang.code}
                            activeOpacity={0.8}
                            style={[styles.item, index === languages.length - 1 && {marginBottom: 0}]}
                            onPress={() => { onSelect(lang); onClose(); }}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityState={{selected: isSelected}}
                            accessibilityLabel={lang.name}
                        >
                            {isSelected ? (
                                <LinearGradient
                                    colors={['rgba(142,45,226,0.5)', 'rgba(74,0,224,0.4)']}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 0}}
                                    style={styles.itemInner}
                                >
                                    <Text allowFontScaling={false} style={styles.flag}>{meta.flag}</Text>
                                    <View style={styles.labelCol}>
                                        <Text allowFontScaling={false} style={[styles.nativeName, styles.nativeNameSelected]}>
                                            {meta.native}
                                        </Text>
                                        <Text allowFontScaling={false} style={[styles.engName, styles.engNameSelected]}>
                                            {lang.name}
                                        </Text>
                                    </View>
                                    <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.itemInner}>
                                    <Text allowFontScaling={false} style={styles.flag}>{meta.flag}</Text>
                                    <View style={styles.labelCol}>
                                        <Text allowFontScaling={false} style={styles.nativeName}>{meta.native}</Text>
                                        <Text allowFontScaling={false} style={styles.engName}>{lang.name}</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

            </Animated.View>
        </Pressable>
    );
}

export default LanguageModal;
