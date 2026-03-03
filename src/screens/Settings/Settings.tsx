import React, {useEffect, useState} from 'react';
import {
    View,
    Text, TouchableOpacity,
} from 'react-native';
import {LanguageType} from "../../types/language.type.ts";
import {changeAppLanguage} from "../../localization/i18n.ts";
import {useTranslation} from "react-i18next";
import {languages} from "../../data/language.ts";

// components
import SettingRow from "../../components/ui/SettingRow/SettingRow.tsx";
import LanguageModal from "../../components/ui/LanguageModal/LanguageModal.tsx";
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import LogoutModal from "../../components/ui/LogoutModal/LogoutModal.tsx";

// styles
import styles from './Settings.style.ts';

function Settings() {
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
                    onChange={setMusic}
                />
                <SettingRow
                    label={`🔊 ${t('soundEffects')}`}
                    value={sound}
                    onChange={setSound}
                />
                <SettingRow
                    label={`📳 ${t('vibration')}`}
                    value={vibration}
                    onChange={setVibration}
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
            <LogoutModal visible={logoutModal} onClose={() => setLogoutModal(false)} onConfirm={() => {

            }}/>
        </View>
    );
}

export default Settings;