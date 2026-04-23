import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {STORAGE_KEYS} from '../../../utils/storageKeys.ts';
import {loadMusic, playMusic, stopMusic} from '../../../utils/helpers.ts';
import {ms, vs} from '../../../utils/responsive.ts';
import {DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, WHITE} from '../../../constants/colors.ts';

// components
import SettingRow from '../SettingRow/SettingRow.tsx';

// icons
import MusicIcon from '../../../assets/icons/MusicIcon.tsx';
import SoundIcon from '../../../assets/icons/SoundIcon.tsx';
import VibrationIcon from '../../../assets/icons/VibrationIcon.tsx';
import ExitIcon from '../../../assets/icons/ExitIcon.tsx';

interface GameMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onExit: () => void;
}

export default function GameMenuModal({visible, onClose, onExit}: GameMenuModalProps) {
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

                {/* Resume */}
                <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.resumeBtn}>
                    <LinearGradient
                        colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.resumeGradient}
                    >
                        <Text style={styles.resumeText}>▶  {t('resume')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}/>

                {/* Settings section */}
                <Text style={styles.sectionLabel}>⚙️  {t('settings')}</Text>
                <View style={styles.card}>
                    <SettingRow
                        label={t('music')}
                        value={music}
                        onChange={toggleMusic}
                        icon={<MusicIcon size={20} color={DARK_PURPLE}/>}
                    />
                    <SettingRow
                        label={t('soundEffects')}
                        value={sound}
                        onChange={toggleSound}
                        icon={<SoundIcon size={20} color={DARK_PURPLE}/>}
                    />
                    <SettingRow
                        label={t('vibration')}
                        value={vibration}
                        onChange={toggleVibration}
                        viewStyle={{borderBottomWidth: 0}}
                        icon={<VibrationIcon size={20} color={DARK_PURPLE}/>}
                    />
                </View>

                {/* Exit button */}
                <TouchableOpacity onPress={onExit} activeOpacity={0.85} style={styles.exitBtnWrapper}>
                    <LinearGradient
                        colors={['#3a0060', '#6a0dad']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.exitGradient}
                    >
                        <ExitIcon size={18} color="#DDA0DD"/>
                        <Text style={styles.exitText}>{t('exitGame')}</Text>
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
        backgroundColor: 'rgba(0,0,0,0.78)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
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
    resumeBtn: {
        width: '100%',
    },
    resumeGradient: {
        borderRadius: ms(14),
        paddingVertical: vs(14),
        alignItems: 'center',
    },
    resumeText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(221,160,221,0.15)',
        marginVertical: ms(18),
    },
    sectionLabel: {
        alignSelf: 'flex-start',
        color: 'rgba(221,160,221,0.7)',
        fontSize: ms(11),
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: ms(10),
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
    exitBtnWrapper: {
        width: '100%',
        borderRadius: ms(14),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.3)',
    },
    exitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
        paddingVertical: vs(13),
    },
    exitText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
