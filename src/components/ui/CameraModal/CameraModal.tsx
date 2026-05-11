import React, {useEffect, useRef} from 'react';
import {Modal, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';

interface CameraModalProps {
    visible: boolean;
    onCapture: (uri: string) => void;
    onClose: () => void;
}

export default function CameraModal({visible, onCapture, onClose}: CameraModalProps) {
    const {hasPermission, requestPermission} = useCameraPermission();
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);

    useEffect(() => {
        if (visible && !hasPermission) {
            requestPermission();
        }
    }, [visible, hasPermission]);

    async function takePhoto() {
        try {
            const photo = await cameraRef.current?.takePhoto({flash: 'off'});
            if (photo?.path) {
                const uri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
                onCapture(uri);
            }
        } catch (e) {
            console.warn('takePhoto error:', e);
        }
    }

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.container}>
                {hasPermission && device ? (
                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={visible}
                        photo={true}
                    />
                ) : (
                    <View style={styles.noPermission}>
                        <Text allowFontScaling={false} style={styles.noPermissionText}>
                            {hasPermission ? 'No camera found' : 'Camera permission required'}
                        </Text>
                    </View>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.closeBtn}>
                        <Text allowFontScaling={false} style={styles.closeTxt}>✕</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={takePhoto} activeOpacity={0.85} style={styles.captureBtn}>
                        <View style={styles.captureInner}/>
                    </TouchableOpacity>

                    <View style={styles.spacer}/>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    noPermission: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPermissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    controls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
    },
    closeBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    closeTxt: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    captureBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    spacer: {
        width: 52,
    },
});
