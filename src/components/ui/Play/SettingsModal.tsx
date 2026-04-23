import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import {loadMusic, playMusic, stopMusic} from '../../../utils/helpers.ts';
import {ms, vs} from '../../../utils/responsive.ts';
import {DARK_PURPLE, PURPLE} from '../../../constants/colors.ts';

// components
import SettingRow from '../SettingRow/SettingRow.tsx';

// icons
import MusicIcon from '../../../assets/icons/MusicIcon.tsx';
import SoundIcon from '../../../assets/icons/SoundIcon.tsx';
import VibrationIcon from '../../../assets/icons/VibrationIcon.tsx';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function SettingsModal({visible, onClose}: SettingsModalProps) {
    const {t} = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const [music, setMusic] = useState(true);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(false);

    useEffect(() => {
        if (visible) {
            loadCurrentSettings();
            scaleAnim.setValue(0);
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    async function loadCurrentSettings() {
        const musicData = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC);
        const soundData = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
        const vibrationData = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION);
        setMusic(!musicData);
        setSound(!soundData);
        setVibration(!!vibrationData);
    }

    const toggleMusic = async (val: boolean) => {
        setMusic(val);
        if (val) {
            await AsyncStorage.removeItem(STORAGE_KEYS.MUSIC);
            loadMusic('games1.mp3');
            setTimeout(() => playMusic(), 200);
        } else {
            await AsyncStorage.setItem(STORAGE_KEYS.MUSIC, 'STOP');
            stopMusic();
        }
    };

    const toggleSound = async (val: boolean) => {
        setSound(val);
        if (val) {
            await AsyncStorage.removeItem(STORAGE_KEYS.SOUND);
        } else {
            await AsyncStorage.setItem(STORAGE_KEYS.SOUND, 'STOP');
        }
    };

    const toggleVibration = async (val: boolean) => {
        setVibration(val);
        if (val) {
            await AsyncStorage.setItem(STORAGE_KEYS.VIBRATION, 'STOP');
        } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.VIBRATION);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                <Text style={styles.title}>⚙️  {t('settings')}</Text>

                <View style={styles.divider} />

                <View style={styles.card}>
                    <SettingRow
                        label={t('music')}
                        value={music}
                        onChange={toggleMusic}
                        icon={<MusicIcon size={20} color={DARK_PURPLE} />}
                    />
                    <SettingRow
                        label={t('soundEffects')}
                        value={sound}
                        onChange={toggleSound}
                        icon={<SoundIcon size={20} color={DARK_PURPLE} />}
                    />
                    <SettingRow
                        label={t('vibration')}
                        value={vibration}
                        onChange={toggleVibration}
                        viewStyle={{borderBottomWidth: 0}}
                        icon={<VibrationIcon size={20} color={DARK_PURPLE} />}
                    />
                </View>

                <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.closeBtn}>
                    <LinearGradient
                        colors={['#3a0060', '#6a0dad']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.closeGradient}
                    >
                        <Text style={styles.closeText}>✕  {t('close')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
    },
    modal: {
        width: '84%',
        backgroundColor: '#1a0030',
        borderRadius: ms(22),
        borderWidth: 1.5,
        borderColor: '#8e2de2',
        paddingHorizontal: ms(20),
        paddingTop: ms(22),
        paddingBottom: ms(20),
        alignItems: 'center',
        shadowColor: '#8e2de2',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 20,
    },
    title: {
        color: '#DDA0DD',
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 2,
        alignSelf: 'flex-start',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(221,160,221,0.15)',
        marginVertical: ms(16),
    },
    card: {
        width: '100%',
        backgroundColor: PURPLE,
        borderRadius: ms(16),
        paddingHorizontal: ms(16),
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.2)',
        marginBottom: ms(18),
    },
    closeBtn: {
        width: '100%',
        borderRadius: ms(14),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.3)',
    },
    closeGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(13),
    },
    closeText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
