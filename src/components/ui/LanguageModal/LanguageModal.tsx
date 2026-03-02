import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity, Pressable,
} from 'react-native';

// styles
import styles from './LanguageModal.style';

const LANGUAGES = ['English', 'Armenian', 'Russian'] as const;

function LanguageModal({
                           visible,
                           onClose,
                           onSelect,
                           selectedLanguage, // new prop
                       }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (lang: (typeof LANGUAGES)[number]) => void;
    selectedLanguage?: (typeof LANGUAGES)[number]; // optional currently selected language
}) {
    return (
        <Modal transparent animationType="fade" visible={visible}>
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Select Language</Text>

                    {LANGUAGES.map(lang => (
                        <TouchableOpacity
                            key={lang}
                            style={[
                                styles.item,
                                selectedLanguage === lang && styles.selectedItem, // highlight
                            ]}
                            onPress={() => {
                                onSelect(lang);
                                onClose();
                            }}
                        >
                            <Text
                                style={[
                                    styles.text,
                                    selectedLanguage === lang && styles.selectedText,
                                ]}
                            >
                                {lang}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

export default LanguageModal;