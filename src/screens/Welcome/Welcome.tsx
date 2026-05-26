import React, {useRef, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
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
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, releaseMusic, stopMusic} from "../../utils/helpers.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";

// services / store
import * as authService from "../../services/authService.ts";
import {useAuthStore} from "../../store/authStore.ts";

// components
import Logo from "../../components/ui/Logo/Logo.tsx";
import SocialAuthButton from "../../components/ui/SocialAuthButton/SocialAuthButton.tsx";
import Ghost from "../../assets/icons/Ghost.tsx";
import SoundIcon from "../../assets/icons/SoundIcon.tsx";
import SoundOffIcon from "../../assets/icons/SoundOffIcon.tsx";

// styles
import styles from './Welcome.style.ts';
import {
    DARK_PURPLE,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    MEDIUM_PURPLE,
    PURPLE,
} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

type AuthMode = 'login' | 'register';

function Welcome() {
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(s => s.setSession);
    const [busy, setBusy] = useState(false);

    // Email auth form
    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
            return 'Please enter a valid email address';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (mode === 'register' && !/^[a-zA-Z0-9_]{3,32}$/.test(name.trim())) {
            return 'Name must be 3-32 letters, numbers or underscores';
        }
        return null;
    }

    async function submitEmailAuth() {
        if (busy) return;
        const validationError = validateForm();
        if (validationError) {
            notice.error('Check your details', validationError);
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
            notice.error('Sign-in failed', error?.message ?? 'Please try again');
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
            notice.error('Sign-in failed', error?.message ?? 'Please try again');
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
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Animated.Text
                        style={[
                            styles.title,
                            {width: '50%', textAlign: 'center'},
                            {
                                opacity: fadeTitle,
                                transform: [{
                                    translateY: fadeTitle.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    }),
                                }],
                            },
                        ]}
                    >
                        Tap Fingers
                    </Animated.Text>

                    {/* Logo + Ghost side by side */}
                    <Animated.View style={[styles.logoRow, {transform: [{translateY: floatAnim}]}]}>
                        <Logo
                            width={width / 1.8}
                            height={height / 3.6}
                        />

                        {/* Ghost peeking from the side */}
                        <Animated.View
                            style={[
                                styles.ghostWrap,
                                {
                                    opacity: ghostOpacity,
                                    transform: [{translateY: ghostFloat}],
                                },
                            ]}
                        >
                            <Ghost size={72} color="rgba(255,255,255,0.88)" eyeColor="#6a0dad" />
                        </Animated.View>
                    </Animated.View>

                    {/* Email auth form */}
                    <Animated.View
                        style={[styles.buttonsWrap, {transform: [{translateY: slideButtons}], opacity: buttonsOpacity}]}
                    >
                        {mode === 'register' && (
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!busy}
                                allowFontScaling={false}
                                returnKeyType="next"
                            />
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!busy}
                            allowFontScaling={false}
                            returnKeyType="next"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!busy}
                            allowFontScaling={false}
                            returnKeyType="done"
                            onSubmitEditing={submitEmailAuth}
                        />

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={submitEmailAuth}
                            disabled={busy}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.primaryGradient}
                            >
                                {busy
                                    ? <ActivityIndicator color="#fff" />
                                    : (
                                        <Text allowFontScaling={false} style={styles.primaryText}>
                                            {mode === 'register' ? 'Create Account' : 'Sign In'}
                                        </Text>
                                    )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleMode}
                            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        >
                            <Text allowFontScaling={false} style={styles.toggleText}>
                                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                <Text style={styles.toggleTextAccent}>
                                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <SocialAuthButton type="ghost" handlePress={signInAsGuest} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

export default Welcome;
