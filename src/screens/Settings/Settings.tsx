import React, {useEffect, useState} from 'react';
import {
    View,
    Text, TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LanguageType} from "../../types/language.type.ts";
import {changeAppLanguage} from "../../localization/i18n.ts";
import {useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, stopMusic} from "../../utils/helpers.ts";
import {useTranslation} from "react-i18next";
import {languages} from "../../data/language.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";

// components
import SettingRow from "../../components/ui/SettingRow/SettingRow.tsx";
import LanguageModal from "../../components/ui/LanguageModal/LanguageModal.tsx";
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import LogoutModal from "../../components/ui/LogoutModal/LogoutModal.tsx";

// icons
import MusicIcon from "../../assets/icons/MusicIcon.tsx";
import SoundIcon from "../../assets/icons/SoundIcon.tsx";
import VibrationIcon from "../../assets/icons/VibrationIcon.tsx";
import LanguageIcon from "../../assets/icons/LanguageIcon.tsx";
import ExitIcon from "../../assets/icons/ExitIcon.tsx";

// styles
import styles from './Settings.style.ts';

function Settings() {
    const navigation = useNavigation<any>();
    const {i18n, t} = useTranslation();
    const currentLang = i18n.language

    const [music, setMusic] = useState(true);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(false);
    const [language, setLanguage] = useState<LanguageType>({name: 'Armenian', code: 'am'});
    const [langModal, setLangModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);

    const getCurrentLanguage = () => {
        const langObj = languages.find((e: LanguageType) => e.code === currentLang)
        setLanguage(langObj || languages[2])
    }

    const logOut = async () => {
        await AsyncStorage.clear();
        setLogoutModal(false);
        navigation.navigate('Welcome');
    }

    const toggleMusic = async (val: boolean) => {
        setMusic(val);
        if (val) {
            await AsyncStorage.removeItem(STORAGE_KEYS.MUSIC);
            loadMusic("gamemusic2.mp3");
            setTimeout(() => {
                playMusic();
            }, 200)
        } else {
            await AsyncStorage.setItem(STORAGE_KEYS.MUSIC, 'STOP');
            stopMusic();
        }
    }

    const toggleSound = async (val: boolean) => {
        setSound(val);
        if (val) {
            await AsyncStorage.removeItem(STORAGE_KEYS.SOUND);
        } else {
            await AsyncStorage.setItem(STORAGE_KEYS.SOUND, 'STOP');
        }
    }

    const toggleVibration = async (val: boolean) => {
        setVibration(val);
        if (val) {
            await AsyncStorage.setItem(STORAGE_KEYS.VIBRATION, 'STOP');
        } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.VIBRATION);
        }
    }

    const getStorageData = async () => {
        try {
            const musicData = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC);
            const soundData = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
            const vibrationData = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION);

            const musicState = !musicData;
            const soundState = !soundData;
            const vibrationState = !vibrationData;

            setMusic(musicState);
            setSound(soundState);
            setVibration(vibrationState);
        } catch (error) {
            setMusic(false);
            setSound(false);
            setVibration(false);
        }
    };

    useEffect(() => {
        getStorageData();
    }, []);

    useEffect(() => {
        getCurrentLanguage();
    }, [currentLang])

    return (
        <LinearGradient
            colors={['#1a1a2e', '#4B0082', '#6a0dad']}
            start={{x: 0, y: 0}}
            end={{x: 0.3, y: 1}}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Settings screen"
        >
            <BackHeader
                title={`⚙️ ${t('settings')}`}
                isProfile={true}
                handleProfilePress={() => navigation.navigate('Profile')}
            />

            <View
                style={styles.card}
                accessible={true}
                accessibilityRole="menu"
                accessibilityLabel="Settings options"
            >
                <SettingRow
                    label={t('music')}
                    value={music}
                    onChange={toggleMusic}
                    icon={<MusicIcon size={20} color="#fff"/>}
                />

                <SettingRow
                    label={t('soundEffects')}
                    value={sound}
                    onChange={toggleSound}
                    icon={<SoundIcon size={20} color="#fff"/>}
                />

                <SettingRow
                    label={t('vibration')}
                    value={vibration}
                    onChange={toggleVibration}
                    icon={<VibrationIcon size={20} color="#fff"/>}
                />

                <SettingRow
                    label={t('language')}
                    valueText={language.name}
                    onPress={() => setLangModal(true)}
                    viewStyle={{ borderBottomWidth: 0 }}
                    icon={<LanguageIcon size={20} color="#fff"/>}
                />
            </View>

            {/* Exit Button */}
            <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={() => setLogoutModal(true)}
                accessibilityRole="button"
                accessibilityLabel={t('exitGame')}
                accessibilityHint="Opens exit confirmation dialog"
                activeOpacity={0.82}
            >
                <LinearGradient
                    colors={['#c0392b', '#7b0000']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.button}
                >
                    <ExitIcon size={22} color="#fff"/>
                    <Text style={styles.buttonText}>{t('exitGame')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <LanguageModal
                visible={langModal}
                onClose={() => setLangModal(false)}
                onSelect={(lang) => {
                    setLanguage(lang);
                    changeAppLanguage(lang.code);
                }}
                selectedLanguage={language.name}
            />

            <LogoutModal
                visible={logoutModal}
                onClose={() => setLogoutModal(false)}
                onConfirm={logOut}
            />
        </LinearGradient>
    );
}

export default Settings;
