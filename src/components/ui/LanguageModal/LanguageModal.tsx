import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity, Pressable,
} from 'react-native';
import {languages} from "../../../data/language.ts";

// styles
import styles from './LanguageModal.style';


function LanguageModal({
                           visible,
                           onClose,
                           onSelect,
                           selectedLanguage, // new prop
                       }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (val: any) => void;
    selectedLanguage?: string;
}) {
    return (
        <Modal transparent animationType="fade" visible={visible}>
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Select Language</Text>

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