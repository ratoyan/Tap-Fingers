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

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>{t('selectLanguage')}</Text>

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
                        >
                            <Text
                                style={[
                                    styles.text,
                                    selectedLanguage === lang.name && styles.selectedText,
                                ]}
                            >
                                {lang.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

export default LanguageModal;