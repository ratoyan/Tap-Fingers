import React, {useRef, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {notice} from '../../utils/notice.ts';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, releaseMusic, stopMusic} from "../../utils/helpers.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";

// services / store
import * as authService from "../../services/authService.ts";
import {useAuthStore} from "../../store/authStore.ts";

// components
import Logo from "../../components/ui/Logo/Logo.tsx";
import WelcomeBackground from "../../components/ui/WelcomeBackground/WelcomeBackground.tsx";
import Ghost from "../../assets/icons/Ghost.tsx";
import SoundIcon from "../../assets/icons/SoundIcon.tsx";
import SoundOffIcon from "../../assets/icons/SoundOffIcon.tsx";
import PersonIcon from "../../assets/icons/PersonIcon.tsx";
import MailIcon from "../../assets/icons/MailIcon.tsx";
import LockIcon from "../../assets/icons/LockIcon.tsx";
import {isTablet, vs} from "../../utils/responsive.ts";

// styles
import styles from './Welcome.style.ts';
import {
    DARK_PURPLE,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    MEDIUM_PURPLE,
    PURPLE, PURPLE_DARK, PURPLE_ONE,
    VIOLET,
} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

type AuthMode = 'login' | 'register';

function Welcome() {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(s => s.setSession);
    const [busy, setBusy] = useState(false);

    // Email auth form
    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

    // Keyboard handling: track its height so we can pad the scroll content,
    // and scroll the focused input into view when the keyboard opens.
    const scrollRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    function handleFieldFocus(field: 'name' | 'email' | 'password') {
        setFocusedField(field);
        // Wait for the keyboard/padding to settle, then reveal the form.
        setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 120);
    }

    // Responsive logo sizing — smaller share of the screen on tablets.
    const logoW = isTablet ? Math.min(width * 0.42, 320) : width / 2.1;
    const logoH = isTablet ? Math.min(height * 0.24, 300) : height / 4;

    const fieldIconSize = isTablet ? 24 : 21;
    const iconColor = (field: 'name' | 'email' | 'password') =>
        focusedField === field ? VIOLET : 'rgba(255,255,255,0.55)';

    // Music on/off (shares the same STORAGE_KEYS.MUSIC flag as Settings)
    const [muted, setMuted] = useState(false);
    const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

    async function toggleSound() {
        if (muted) {
            await AsyncStorage.removeItem(STORAGE_KEYS.MUSIC);
            loadMusic('gamemusic.wav');
            playMusic();
            setMuted(false);
        } else {
            await AsyncStorage.setItem(STORAGE_KEYS.MUSIC, 'STOP');
            stopMusic();
            setMuted(true);
        }
    }

    const fadeTitle   = useRef(new Animated.Value(0)).current;
    const slideButtons = useRef(new Animated.Value(50)).current;
    const floatAnim   = useRef(new Animated.Value(0)).current;
    const ghostFloat  = useRef(new Animated.Value(0)).current;
    const ghostOpacity = useRef(new Animated.Value(0)).current;
    const ctaPulse    = useRef(new Animated.Value(1)).current;

    // Local-only gameplay helpers (bomb/slow/shield) are still device-side —
    // seed the starter stock so a brand-new player has one of each.
    async function seedHelperDefaults() {
        try {
            const existing = await AsyncStorage.getItem(STORAGE_KEYS.BOMB_COUNT);
            if (existing != null) return;
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.BOMB_COUNT, JSON.stringify(1)],
                [STORAGE_KEYS.SLOW_COUNT, JSON.stringify(1)],
                [STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(1)],
            ]);
        } catch (error) {
            console.log('Seed error:', error);
        }
    }

    // After a successful auth: hydrate the session from the backend profile,
    // then drop the auth screen from the stack so Back can't return here.
    async function enterApp() {
        await setSession();
        navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }

    // Mirrors the backend validators (tapfingers-server auth.validator):
    // username 3-32 alphanumeric/underscore, valid email, password 6-72.
    function validateForm(): string | null {
        const trimmedEmail = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            return t('validEmailError');
        }
        if (password.length < 6) {
            return t('passwordMinError');
        }
        if (mode === 'register' && !/^[a-zA-Z0-9_]{3,32}$/.test(name.trim())) {
            return t('nameRuleError');
        }
        return null;
    }

    async function submitEmailAuth() {
        if (busy) return;
        const validationError = validateForm();
        if (validationError) {
            notice.error(t('checkDetails'), validationError);
            return;
        }
        setBusy(true);
        try {
            if (mode === 'register') {
                await authService.emailRegister(name.trim(), email.trim(), password);
            } else {
                await authService.emailLogin(email.trim(), password);
            }
            await enterApp();
        } catch (error: any) {
            notice.error(t('signInFailed'), error?.message ?? t('tryAgain'));
        } finally {
            setBusy(false);
        }
    }

    function toggleMode() {
        if (busy) return;
        setMode(prev => (prev === 'login' ? 'register' : 'login'));
    }

    async function signInAsGuest() {
        if (busy) return;
        setBusy(true);
        try {
            await authService.guestLogin();
            await enterApp();
        } catch (error: any) {
            notice.error(t('signInFailed'), error?.message ?? t('tryAgain'));
        } finally {
            setBusy(false);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            seedHelperDefaults();
            // Reflect the stored music preference on the toggle.
            AsyncStorage.getItem(STORAGE_KEYS.MUSIC).then(cancel => setMuted(!!cancel));
            releaseMusic();
            loadMusic("gamemusic.wav");
            const timeout = setTimeout(() => playMusic(), 200);
            return () => clearTimeout(timeout);
        }, [])
    );

    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvt, e => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
            setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 60);
        });
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        // Title fade in
        Animated.timing(fadeTitle, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Buttons slide up
        Animated.timing(slideButtons, {
            toValue: 0,
            duration: 800,
            delay: 300,
            useNativeDriver: true,
        }).start();

        // Logo float loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {toValue: -15, duration: 1000, useNativeDriver: true}),
                Animated.timing(floatAnim, {toValue: 0,   duration: 1000, useNativeDriver: true}),
                Animated.timing(floatAnim, {toValue: 15,  duration: 1000, useNativeDriver: true}),
                Animated.timing(floatAnim, {toValue: 0,   duration: 1000, useNativeDriver: true}),
            ])
        ).start();

        // Ghost fade in then float (opposite phase)
        Animated.timing(ghostOpacity, {
            toValue: 1,
            duration: 1000,
            delay: 600,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(ghostFloat, {toValue: 12,  duration: 1100, useNativeDriver: true}),
                Animated.timing(ghostFloat, {toValue: 0,   duration: 1100, useNativeDriver: true}),
                Animated.timing(ghostFloat, {toValue: -12, duration: 1100, useNativeDriver: true}),
                Animated.timing(ghostFloat, {toValue: 0,   duration: 1100, useNativeDriver: true}),
            ])
        ).start();

        // Gentle "tap me" pulse on the primary call-to-action.
        Animated.loop(
            Animated.sequence([
                Animated.timing(ctaPulse, {toValue: 1.035, duration: 1200, useNativeDriver: true}),
                Animated.timing(ctaPulse, {toValue: 1,     duration: 1200, useNativeDriver: true}),
            ])
        ).start();
    }, []);

    const buttonsOpacity = slideButtons.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
    });

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE, MEDIUM_PURPLE]}
            style={styles.container}
        >
            {/* Animated decorative layer */}
            <WelcomeBackground />

            {/* Sound on/off — top right */}
            <TouchableOpacity
                style={[styles.soundButton, {top: topInset + 8}]}
                onPress={toggleSound}
                activeOpacity={0.8}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Turn sound on' : 'Turn sound off'}
            >
                {muted
                    ? <SoundOffIcon size={24} color="#fff" />
                    : <SoundIcon size={24} color="#fff" />}
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.scrollContent,
                        Platform.OS === 'android' && {paddingBottom: vs(28) + keyboardHeight},
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <Animated.View
                            style={{
                                alignItems: 'center',
                                opacity: fadeTitle,
                                transform: [{
                                    translateY: fadeTitle.interpolate({inputRange: [0, 1], outputRange: [20, 0]}),
                                }],
                            }}
                        >
                            <Text allowFontScaling={false} style={styles.title}>Tap Fingers</Text>
                            <Text allowFontScaling={false} style={styles.subtitle}>{t('tapFast')}</Text>
                        </Animated.View>

                        {/* Logo + Ghost side by side */}
                        <Animated.View style={[styles.logoRow, {transform: [{translateY: floatAnim}]}]}>
                            <Logo width={logoW} height={logoH} />

                            {/* Ghost peeking from the side */}
                            <Animated.View
                                style={[
                                    styles.ghostWrap,
                                    {opacity: ghostOpacity, transform: [{translateY: ghostFloat}]},
                                ]}
                            >
                                <Ghost size={isTablet ? 88 : 72} color="rgba(255,255,255,0.88)" eyeColor="#6a0dad" />
                            </Animated.View>
                        </Animated.View>

                        {/* Email auth card */}
                        <Animated.View
                            style={[styles.card, {transform: [{translateY: slideButtons}], opacity: buttonsOpacity}]}
                        >
                            <Text allowFontScaling={false} style={styles.cardTitle}>
                                {mode === 'register' ? `✨ ${t('createYourAccount')}` : `👋 ${t('welcomeBack')}`}
                            </Text>

                            {mode === 'register' && (
                                <View style={[styles.fieldRow, focusedField === 'name' && styles.fieldRowFocused]}>
                                    <PersonIcon size={fieldIconSize} color={iconColor('name')} style={styles.fieldIcon} />
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder={t('name')}
                                        placeholderTextColor="rgba(255,255,255,0.45)"
                                        value={name}
                                        onChangeText={setName}
                                        onFocus={() => handleFieldFocus('name')}
                                        onBlur={() => setFocusedField(null)}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!busy}
                                        allowFontScaling={false}
                                        returnKeyType="next"
                                    />
                                </View>
                            )}

                            <View style={[styles.fieldRow, focusedField === 'email' && styles.fieldRowFocused]}>
                                <MailIcon size={fieldIconSize} color={iconColor('email')} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder={t('email')}
                                    placeholderTextColor="rgba(255,255,255,0.45)"
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => handleFieldFocus('email')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!busy}
                                    allowFontScaling={false}
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={[styles.fieldRow, focusedField === 'password' && styles.fieldRowFocused]}>
                                <LockIcon size={fieldIconSize} color={iconColor('password')} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder={t('password')}
                                    placeholderTextColor="rgba(255,255,255,0.45)"
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => handleFieldFocus('password')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!busy}
                                    allowFontScaling={false}
                                    returnKeyType="done"
                                    onSubmitEditing={submitEmailAuth}
                                />
                            </View>

                            <Animated.View style={{width: '100%', transform: [{scale: ctaPulse}]}}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={submitEmailAuth}
                                    disabled={busy}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={[PURPLE_DARK, GRADIENT_LIGHT]}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 1}}
                                        style={styles.primaryGradient}
                                    >
                                        {busy
                                            ? <ActivityIndicator color="#fff" />
                                            : (
                                                <Text allowFontScaling={false} style={styles.primaryText}>
                                                    {mode === 'register' ? t('createAccount') : t('signIn')}
                                                </Text>
                                            )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            <TouchableOpacity
                                onPress={toggleMode}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            >
                                <Text allowFontScaling={false} style={styles.toggleText}>
                                    {mode === 'login' ? t('noAccount') : t('haveAccount')}
                                    <Text style={styles.toggleTextAccent}>
                                        {mode === 'login' ? t('signUp') : t('signInAction')}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <Animated.View style={[styles.dividerRow, {opacity: buttonsOpacity}]}>
                            <View style={styles.dividerLine} />
                            <Text allowFontScaling={false} style={styles.dividerText}>{t('or')}</Text>
                            <View style={styles.dividerLine} />
                        </Animated.View>

                        {/* Guest */}
                        <Animated.View
                            style={{
                                width: '100%',
                                opacity: buttonsOpacity,
                                transform: [{translateY: slideButtons}],
                            }}
                        >
                            <TouchableOpacity
                                style={styles.guestButton}
                                onPress={signInAsGuest}
                                disabled={busy}
                                activeOpacity={0.8}
                            >
                                <Ghost size={24} color="rgba(255,255,255,0.85)" eyeColor="#9370DB" />
                                <Text allowFontScaling={false} style={styles.guestButtonText}>{t('continueAsGuest')}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

export default Welcome;
