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
import {playSfx, setSfxMuted} from "../../utils/sfx.ts";
import {haptic, setHapticsEnabled} from "../../utils/haptics.ts";
import {useTranslation} from "react-i18next";
import {languages} from "../../data/language.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {storage} from "../../db/kvStore.ts";
import {useAuthStore} from "../../store/authStore.ts";

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
import ScreenStatusBar from "../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx";

function Settings() {
    const navigation = useNavigation<any>();
    const {i18n, t} = useTranslation();
    const currentLang = i18n.language;

    const [music, setMusic] = useState(true);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(false);
    const [language, setLanguage] = useState<LanguageType>(languages[0]);
    const [langModal, setLangModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);

    // The native push animation can't start until this screen's first commit
    // lands, so whatever is mounted in that commit is dead time between the tap
    // on the menu and the screen moving at all. There's no one hot spot here —
    // it's the eight gradients, five icons and three switches adding up — so
    // the whole body is held back one frame: the shell (status bar + header)
    // commits immediately, the push starts, and the rest mounts on the next
    // frame while the screen is still off the right edge.
    const [contentReady, setContentReady] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setContentReady(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const getCurrentLanguage = () => {
        const langObj = languages.find((e: LanguageType) => e.code === currentLang);
        setLanguage(langObj || languages[2]);
    };

    const logOut = async () => {
        // Revoke the refresh token server-side, clear tokens + reset the stores...
        await useAuthStore.getState().logout();
        // ...then wipe the remaining device-local data (settings, helper counts).
        await storage.clear();
        setLogoutModal(false);
        navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
    };

    const toggleMusic = async (val: boolean) => {
        setMusic(val);
        if (val) {
            await storage.removeItem(STORAGE_KEYS.MUSIC);
            loadMusic("gamemusic2.mp3");
            setTimeout(() => { playMusic(); }, 200);
        } else {
            await storage.setItem(STORAGE_KEYS.MUSIC, 'STOP');
            stopMusic();
        }
    };

    const toggleSound = async (val: boolean) => {
        setSound(val);
        // Mirror into the SFX module so the gate flips now, not on Play's next
        // focus — and so the preview below is actually audible.
        setSfxMuted(!val);
        if (val) {
            await storage.removeItem(STORAGE_KEYS.SOUND);
            playSfx('tap'); // preview, so the toggle proves itself
        } else {
            await storage.setItem(STORAGE_KEYS.SOUND, 'STOP');
        }
    };

    const toggleVibration = async (val: boolean) => {
        setVibration(val);
        // Mirror into the haptics module so the gate flips now, not on Play's
        // next focus — and so the preview below is actually felt.
        setHapticsEnabled(val);
        // Stored 'STOP' means OFF, the same as music/sound. This was written
        // inverted, so turning vibration on is what switched it off in Play.
        if (val) {
            await storage.removeItem(STORAGE_KEYS.VIBRATION);
        } else {
            await storage.setItem(STORAGE_KEYS.VIBRATION, 'STOP');
        }
        if (val) haptic('heart'); // preview, so the toggle proves itself
    };

    const getStorageData = async () => {
        try {
            const musicData = await storage.getItem(STORAGE_KEYS.MUSIC);
            const soundData = await storage.getItem(STORAGE_KEYS.SOUND);
            const vibrationData = await storage.getItem(STORAGE_KEYS.VIBRATION);
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
            <ScreenStatusBar/>

            <BackHeader
                title={`⚙️ ${t('settings')}`}
                isProfile={true}
                handleProfilePress={() => navigation.navigate('Profile')}
            />

            {contentReady && <>
            {/* Audio Section */}
            <View style={styles.sectionHeader}>
                <LinearGradient
                    colors={['#8e2de2', '#DDA0DD']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.sectionLine}
                />
                <Text allowFontScaling={false} style={styles.sectionTitle}>{t('audioSection')}</Text>
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
                <Text allowFontScaling={false} style={styles.sectionTitle}>{t('generalSection')}</Text>
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
                    valueText={language.native}
                    onPress={() => setLangModal(true)}
                    viewStyle={{borderBottomWidth: 0}}
                    icon={<LanguageIcon size={20} color={DARK_PURPLE}/>}
                />
            </View>

            {/* Exit Button — premium pill, centered */}
            <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={() => setLogoutModal(true)}
                activeOpacity={0.85}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('exitGame')}
            >
                <LinearGradient
                    colors={['#2a0845', '#6a1b9a', VIOLET_MEDIUM]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.button}
                >
                    {/* Glossy top sheen */}
                    <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                        style={styles.buttonSheen}
                    />
                    <View style={styles.buttonIconChip}>
                        <ExitIcon size={18} color="#fff"/>
                    </View>
                    <Text allowFontScaling={false} style={styles.buttonText}>{t('exitGame')}</Text>
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
            </>}
        </LinearGradient>
    );
}

export default Settings;
