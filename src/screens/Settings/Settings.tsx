import React, {useState} from 'react';
import {
    View,
    Text, TouchableOpacity, Alert,
} from 'react-native';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";

// components
import SettingRow from "../../components/ui/SettingRow/SettingRow.tsx";
import LanguageModal from "../../components/ui/LanguageModal/LanguageModal.tsx";

// styles
import styles from './Settings.style.ts';
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import LogoutModal from "../../components/ui/LogoutModal/LogoutModal.tsx";

function Settings() {
    const insets = useSafeAreaInsets();

    const [music, setMusic] = useState(true);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(false);
    const [language, setLanguage] = useState<'English' | 'Armenian' | 'Russian'>('English');
    const [langModal, setLangModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);


    return (
        <View style={styles.container}>
            <BackHeader title={'⚙️ SETTINGS'}/>

            <View style={styles.card}>
                <SettingRow
                    label="🎵 Music"
                    value={music}
                    onChange={setMusic}
                />
                <SettingRow
                    label="🔊 Sound Effects"
                    value={sound}
                    onChange={setSound}
                />
                <SettingRow
                    label="📳 Vibration"
                    value={vibration}
                    onChange={setVibration}
                />
                <SettingRow
                    label="🌍 Language"
                    valueText={language}
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
                    EXIT GAME
                </Text>
            </TouchableOpacity>
            <LanguageModal
                visible={langModal}
                onClose={() => setLangModal(false)}
                onSelect={(lang) => setLanguage(lang)}
                selectedLanguage={language}
            />
            <LogoutModal visible={logoutModal} onClose={() => setLogoutModal(false)} onConfirm={() => {

            }}/>
        </View>
    );
}

export default Settings;