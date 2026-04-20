import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
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
import {DARK_PURPLE, GRADIENT_LIGHT, PURPLE, PURPLE_DARK, VIOLET_MEDIUM} from "../../constants/colors.ts";

function Settings() {
    const navigation = useNavigation<any>();
    const {i18n, t} = useTranslation();
    const currentLang = i18n.language;

    const [music, setMusic] = useState(true);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(false);
    const [language, setLanguage] = useState<LanguageType>({name: 'Armenian', code: 'am'});
    const [langModal, setLangModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);

    const getCurrentLanguage = () => {
        const langObj = languages.find((e: LanguageType) => e.code === currentLang);
        setLanguage(langObj || languages[2]);
    };

    const logOut = async () => {
        await AsyncStorage.clear();
        setLogoutModal(false);
        navigation.navigate('Welcome');
    };

    const toggleMusic = async (val: boolean) => {
        setMusic(val);
        if (val) {
            await AsyncStorage.removeItem(STORAGE_KEYS.MUSIC);
            loadMusic("gamemusic2.mp3");
            setTimeout(() => { playMusic(); }, 200);
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

    const getStorageData = async () => {
        try {
            const musicData = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC);
            const soundData = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
            const vibrationData = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION);
            setMusic(!musicData);
            setSound(!soundData);
            setVibration(!vibrationData);
        } catch (error) {
            setMusic(false);
            setSound(false);
            setVibration(false);
        }
    };

    useEffect(() => { getStorageData(); }, []);
    useEffect(() => { getCurrentLanguage(); }, [currentLang]);

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE_DARK]}
            start={{x: 0, y: 0}}
            end={{x: 0.3, y: 1}}
            style={styles.container}
        >
            <BackHeader
                title={`⚙️ ${t('settings')}`}
                isProfile={true}
                handleProfilePress={() => navigation.navigate('Profile')}
            />

            {/* Audio Section */}
            <View style={styles.sectionHeader}>
                <LinearGradient
                    colors={['#8e2de2', '#DDA0DD']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.sectionLine}
                />
                <Text style={styles.sectionTitle}>🎵 AUDIO</Text>
                <LinearGradient
                    colors={['#DDA0DD', '#8e2de2']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.sectionLine}
                />
            </View>

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

            {/* General Section */}
            <View style={styles.sectionHeader}>
                <LinearGradient
                    colors={['#4a00e0', '#DDA0DD']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.sectionLine}
                />
                <Text style={styles.sectionTitle}>🌐 GENERAL</Text>
                <LinearGradient
                    colors={['#DDA0DD', '#4a00e0']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.sectionLine}
                />
            </View>

            <View style={styles.card}>
                <SettingRow
                    label={t('language')}
                    valueText={language.name}
                    onPress={() => setLangModal(true)}
                    viewStyle={{borderBottomWidth: 0}}
                    icon={<LanguageIcon size={20} color={DARK_PURPLE}/>}
                />
            </View>

            {/* Exit Button — small & centered */}
            <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={() => setLogoutModal(true)}
                activeOpacity={0.75}
            >
                <LinearGradient
                    colors={['#1a0030', '#5B0EA6', VIOLET_MEDIUM]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.button}
                >
                    <ExitIcon size={20} color="#DDA0DD"/>
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
