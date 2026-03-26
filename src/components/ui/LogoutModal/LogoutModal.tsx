import React from 'react';
import {View, Text, TouchableOpacity, Pressable} from 'react-native';
import {useTranslation} from "react-i18next";

// styles
import styles from './LogoutModal.style.ts';

export default function LogoutModal({visible, onClose, onConfirm}: any) {
    const {t} = useTranslation();

    if (!visible) return null;

    return (
        <Pressable style={styles.overlay}
                   onPress={onClose}
                   accessible={false}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.title}
                      accessibilityRole="header"
                >
                    {t('exitGame')}
                </Text>
                <Text style={styles.message}
                      accessible={true}
                      accessibilityLabel={t('exitGameDescription')}
                >
                    {t('exitGameDescription')}
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]}
                                      onPress={onClose}
                                      accessible={true}
                                      accessibilityRole="button"
                                      accessibilityLabel={t('cancel')}
                                      accessibilityHint={t('cancelExitHint') || "Cancel exiting the game"}
                    >
                        <Text style={[styles.buttonText, styles.cancelText]}
                              importantForAccessibility="no-hide-descendants"
                        >
                            {t('cancel')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.confirmButton]}
                                      onPress={onConfirm}
                                      accessible={true}
                                      accessibilityRole="button"
                                      accessibilityLabel={t('yes')}
                                      accessibilityHint={t('confirmExitHint') || "Confirm exiting the game"}
                    >
                        <Text style={[styles.buttonText, styles.confirmText]}
                              importantForAccessibility="no-hide-descendants"
                        >
                            {t('yes')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Pressable>
    );
}