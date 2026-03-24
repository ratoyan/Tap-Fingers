import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity, Pressable,
} from 'react-native';
import {languages} from "../../../data/language.ts";
import {useTranslation} from "react-i18next";

// styles
import styles from './LanguageModal.style';

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (val: any) => void;
    selectedLanguage?: string;
}


function LanguageModal({
                           visible,
                           onClose,
                           onSelect,
                           selectedLanguage, // new prop
                       }: LanguageModalProps) {
    const {t} = useTranslation();

    if (!visible) return null;

    return <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessible={false}
    >
        <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">{t('selectLanguage')}</Text>

            {languages.map(lang => (
                <TouchableOpacity
                    key={lang.code}
                    style={[
                        styles.item,
                        selectedLanguage === lang.name && styles.selectedItem, // highlight
                    ]}
                    onPress={() => {
                        onSelect(lang);
                        onClose();
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{selected: selectedLanguage === lang.name}}
                    accessibilityLabel={lang.name}
                    accessibilityHint="Double tap to select this language"
                >
                    <Text
                        style={[
                            styles.text,
                            selectedLanguage === lang.name && styles.selectedText,
                        ]}
                        importantForAccessibility="no-hide-descendants"
                    >
                        {lang.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </Pressable>
}

export default LanguageModal;