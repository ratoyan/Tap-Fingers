import React from 'react';
import {View, Text, TouchableOpacity, Modal, Pressable} from 'react-native';

// styles
import styles from './LogoutModal.style.ts';
import {useTranslation} from "react-i18next";

export default function LogoutModal({ visible, onClose, onConfirm }: any) {
    const {t} = useTranslation();

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{t('exitGame')}</Text>
                    <Text style={styles.message}>{t('exitGameDescription')}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={[styles.buttonText, styles.cancelText]}>{t('cancel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                            <Text style={[styles.buttonText, styles.confirmText]}>{t('yes')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}