import React, {useRef, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Animated, Dimensions} from 'react-native';
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';

// services / store
import * as authService from "../../services/authService.ts";
import {useAuthStore} from "../../store/authStore.ts";

// components
import Logo from "../../components/ui/Logo/Logo.tsx";
import SocialAuthButton from "../../components/ui/SocialAuthButton/SocialAuthButton.tsx";
import Ghost from "../../assets/icons/Ghost.tsx";

// styles
import styles from './Welcome.style.ts';
import {DARK_PURPLE, MEDIUM_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

function Welcome() {
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(s => s.setSession);
    const [busy, setBusy] = useState(false);

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

    async function signInWithGoogle() {
        if (busy) return;
        setBusy(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo: any = await GoogleSignin.signIn();

            // google-signin v13+ nests the payload under `.data`.
            let idToken: string | undefined =
                userInfo?.data?.idToken ?? userInfo?.idToken;
            if (!idToken) {
                const tokens = await GoogleSignin.getTokens();
                idToken = tokens?.idToken;
            }
            if (!idToken) throw new Error('Could not obtain Google ID token');

            await authService.googleLogin(idToken);
            await enterApp();
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Cancelled', 'User cancelled login');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Loading', 'Login already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                Alert.alert('Sign-in failed', error?.message ?? 'Please try again');
            }
        } finally {
            setBusy(false);
        }
    }

    async function signInAsGuest() {
        if (busy) return;
        setBusy(true);
        try {
            await authService.guestLogin();
            await enterApp();
        } catch (error: any) {
            Alert.alert('Sign-in failed', error?.message ?? 'Please try again');
        } finally {
            setBusy(false);
        }
    }

    async function signInWithApple() {
        if (busy) return;
        if (!appleAuth.isSupported) {
            Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS 13+.');
            return;
        }
        setBusy(true);
        try {
            const resp = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            if (!resp.identityToken) throw new Error('No identity token from Apple');

            await authService.appleLogin(resp.identityToken);
            await enterApp();
        } catch (error: any) {
            if (error?.code !== appleAuth.Error.CANCELED) {
                Alert.alert('Sign-in failed', error?.message ?? 'Please try again');
            }
        } finally {
            setBusy(false);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            seedHelperDefaults();
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

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
            offlineAccess: true,
        });
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
                    width={width / 1.5}
                    height={height / 2.6}
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

            {/* Buttons */}
            <Animated.View
                style={[styles.buttonsWrap, {transform: [{translateY: slideButtons}], opacity: buttonsOpacity}]}
            >
                {busy && <ActivityIndicator size="large" color="#FFD700" style={{marginBottom: 12}}/>}
                <SocialAuthButton type="google" handlePress={signInWithGoogle} />
                <SocialAuthButton type="apple"  handlePress={signInWithApple} />
                <SocialAuthButton type="ghost"  handlePress={signInAsGuest} />
            </Animated.View>
        </LinearGradient>
    );
}

export default Welcome;
