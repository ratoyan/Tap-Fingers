import React, {useRef, useEffect} from 'react';
import {Alert, Animated, Dimensions} from 'react-native';
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {shops} from "../../data/shop.ts";
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';

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

    const fadeTitle   = useRef(new Animated.Value(0)).current;
    const slideButtons = useRef(new Animated.Value(50)).current;
    const floatAnim   = useRef(new Animated.Value(0)).current;
    const ghostFloat  = useRef(new Animated.Value(0)).current;
    const ghostOpacity = useRef(new Animated.Value(0)).current;

    async function saveCardAndBackground() {
        try {
            if (!shops || shops.length === 0) return;

            const firstCardId = shops[0].id.toString();

            await AsyncStorage.multiSet([
                [STORAGE_KEYS.CARDSID, JSON.stringify([firstCardId])],
                [STORAGE_KEYS.CARDID, JSON.stringify(firstCardId)],
                [STORAGE_KEYS.BOMB_COUNT, JSON.stringify(1)],
                [STORAGE_KEYS.SLOW_COUNT, JSON.stringify(1)],
                [STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(1)],
            ]);
        } catch (error) {
            console.log('Save error:', error);
        }
    }

    async function goHome(authType: 'google' | 'apple' | 'guest') {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TYPE, authType);
        navigation.navigate('Home');
    }

    async function signInWithGoogle() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo: any = await GoogleSignin.signIn();
            Alert.alert('Success', `Welcome ${userInfo.user.name}`);
            await goHome('google');
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Cancelled', 'User cancelled login');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Loading', 'Login already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                Alert.alert('Error', error.message);
            }
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            saveCardAndBackground();
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
                <SocialAuthButton type="google" handlePress={() => signInWithGoogle()} />
                <SocialAuthButton type="apple"  handlePress={() => goHome('apple')} />
                <SocialAuthButton type="ghost"  handlePress={() => goHome('guest')} />
            </Animated.View>
        </LinearGradient>
    );
}

export default Welcome;
