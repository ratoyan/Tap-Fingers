import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';

// components
import BackHeader from '../../components/ui/BackHeader/BackHeader.tsx';
import PhotoPickerSheet from '../../components/ui/PhotoPickerSheet/PhotoPickerSheet.tsx';
import SocialAuthButton from '../../components/ui/SocialAuthButton/SocialAuthButton.tsx';
import Ghost from '../../assets/icons/Ghost.tsx';
import UserIcon from '../../assets/icons/UserIcon.tsx';

// styles
import styles from './Profile.style.ts';
import {GRADIENT_LIGHT, PURPLE, VIOLET} from '../../constants/colors.ts';
import {STORAGE_KEYS} from '../../utils/storageKeys.ts';

const DEFAULT_AVATAR = '';
const STORAGE_KEY_NAME  = 'profile_username';
const STORAGE_KEY_PHOTO = 'profile_photo';

function Profile() {
    const [username,     setUsername]     = useState('Your Name');
    const [photoUri,     setPhotoUri]     = useState<string>(DEFAULT_AVATAR);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [isGuest,      setIsGuest]      = useState(false);
    const {t} = useTranslation();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
            offlineAccess: true,
        });

        (async () => {
            const [savedName, savedPhoto, authType] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY_NAME),
                AsyncStorage.getItem(STORAGE_KEY_PHOTO),
                AsyncStorage.getItem(STORAGE_KEYS.AUTH_TYPE),
            ]);
            if (authType === 'guest') setIsGuest(true);
            if (savedName)  setUsername(savedName);
            if (savedPhoto) setPhotoUri(savedPhoto);
        })();
    }, []);

    // ── Auth ────────────────────────────────────────────────

    async function signInWithGoogle() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo: any = await GoogleSignin.signIn();
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TYPE, 'google');

            // Pre-fill name from Google account
            if (userInfo?.data?.user?.name) {
                setUsername(userInfo.data.user.name);
                await AsyncStorage.setItem(STORAGE_KEY_NAME, userInfo.data.user.name);
            }
            if (userInfo?.data?.user?.photo) {
                setPhotoUri(userInfo.data.user.photo);
                await AsyncStorage.setItem(STORAGE_KEY_PHOTO, userInfo.data.user.photo);
            }

            setIsGuest(false);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
            if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('', 'Login already in progress');
            } else {
                Alert.alert('Error', error.message);
            }
        }
    }

    async function signInWithApple() {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TYPE, 'apple');
        setIsGuest(false);
    }

    // ── Photo ───────────────────────────────────────────────

    async function handleNameChange(value: string) {
        setUsername(value);
        await AsyncStorage.setItem(STORAGE_KEY_NAME, value);
    }

    async function handlePickResult(uri: string) {
        setPhotoUri(uri);
        await AsyncStorage.setItem(STORAGE_KEY_PHOTO, uri);
        setSheetVisible(false);
    }

    function handleCamera() {
        launchCamera({mediaType: 'photo', quality: 0.8}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) handlePickResult(uri);
        });
    }

    function handleGallery() {
        launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) handlePickResult(uri);
        });
    }

    // ── Render ──────────────────────────────────────────────

    return (
        <LinearGradient
            colors={[GRADIENT_LIGHT, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Profile screen"
        >
            <BackHeader title={`👨‍🎓 ${t('profile')}`} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.scrollContainer}>

                    {isGuest ? (
                        /* ── Guest view ──────────────────────── */
                        <View style={styles.guestSection}>
                            <View style={styles.ghostAvatarWrap}>
                                <Ghost size={110} color="rgba(255,255,255,0.9)" eyeColor="#6a0dad" />
                            </View>

                            <Text style={styles.guestName}>👻 Guest Player</Text>
                            <Text style={styles.guestHint}>
                                Sign in to save your progress
                            </Text>

                            {/* Divider */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>Sign in with</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Social buttons */}
                            <View style={styles.authButtons}>
                                <SocialAuthButton type="google" handlePress={signInWithGoogle} />
                                <SocialAuthButton type="apple"  handlePress={signInWithApple} />
                            </View>
                        </View>
                    ) : (
                        /* ── Logged-in view ──────────────────── */
                        <>
                            <View style={styles.avatarSection}>
                                <TouchableOpacity
                                    onPress={() => setSheetVisible(true)}
                                    activeOpacity={0.85}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('changePhoto')}
                                >
                                    <View style={styles.avatarWrapper}>
                                        {photoUri ? (
                                            <Image
                                                source={{uri: photoUri}}
                                                style={styles.avatar}
                                                accessibilityRole="image"
                                                accessibilityLabel="User profile picture"
                                            />
                                        ) : (
                                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                                <UserIcon size={70} color="rgba(255,255,255,0.9)"/>
                                            </View>
                                        )}
                                        <View style={styles.cameraOverlay}>
                                            <Text style={styles.cameraIcon}>📷</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.changePhotoText}>{t('changePhoto')}</Text>
                            </View>

                            <Text style={styles.greeting}>Hello, {username}!</Text>

                            <View style={styles.inputCard}>
                                <Text style={styles.inputLabel}>✏️  Name</Text>
                                <TextInput
                                    value={username}
                                    onChangeText={handleNameChange}
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor={VIOLET}
                                    accessibilityLabel="Username input field"
                                    accessibilityRole="text"
                                    returnKeyType="done"
                                />
                            </View>
                        </>
                    )}

                </View>
            </TouchableWithoutFeedback>

            {!isGuest && (
                <PhotoPickerSheet
                    visible={sheetVisible}
                    onCamera={handleCamera}
                    onGallery={handleGallery}
                    onClose={() => setSheetVisible(false)}
                />
            )}
        </LinearGradient>
    );
}

export default Profile;
