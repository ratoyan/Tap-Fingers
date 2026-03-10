import React, {useEffect, useState} from 'react';
import {
    View,
    Text, TouchableOpacity,
} from 'react-native';
import {LanguageType} from "../../types/language.type.ts";
import {changeAppLanguage} from "../../localization/i18n.ts";
import {useTranslation} from "react-i18next";
import {languages} from "../../data/language.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, stopMusic} from "../../utils/helpers.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";

// components
import SettingRow from "../../components/ui/SettingRow/SettingRow.tsx";
import LanguageModal from "../../components/ui/LanguageModal/LanguageModal.tsx";
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import LogoutModal from "../../components/ui/LogoutModal/LogoutModal.tsx";

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
        <View style={styles.container}>
            <BackHeader title={`⚙️ ${t('settings')}`}/>

            <View style={styles.card}>
                <SettingRow
                    label={`🎵 ${t('music')}`}
                    value={music}
                    onChange={toggleMusic}
                />
                <SettingRow
                    label={`🔊 ${t('soundEffects')}`}
                    value={sound}
                    onChange={toggleSound}
                />
                <SettingRow
                    label={`📳 ${t('vibration')}`}
                    value={vibration}
                    onChange={toggleVibration}
                />
                <SettingRow
                    label={`🌍 ${t('language')}`}
                    valueText={language.name}
                    onPress={() => setLangModal(true)}
                    viewStyle={{borderBottomWidth: 0}}
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    setLogoutModal(true);
                }}
            >
                <Text
                    style={styles.buttonText}>
                    {t('exitGame')}
                </Text>
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
            <LogoutModal visible={logoutModal} onClose={() => setLogoutModal(false)} onConfirm={logOut}/>
        </View>
    );
}

export default Settings;