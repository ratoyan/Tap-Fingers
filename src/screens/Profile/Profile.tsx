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
    ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';

// services / store
import * as authService from '../../services/authService.ts';
import * as userService from '../../services/userService.ts';
import {useAuthStore} from '../../store/authStore.ts';

// components
import BackHeader from '../../components/ui/BackHeader/BackHeader.tsx';
import PhotoPickerSheet from '../../components/ui/PhotoPickerSheet/PhotoPickerSheet.tsx';
import CameraModal from '../../components/ui/CameraModal/CameraModal.tsx';
import SocialAuthButton from '../../components/ui/SocialAuthButton/SocialAuthButton.tsx';
import Ghost from '../../assets/icons/Ghost.tsx';
import UserIcon from '../../assets/icons/UserIcon.tsx';

// styles
import styles from './Profile.style.ts';
import {GRADIENT_LIGHT, PURPLE, VIOLET} from '../../constants/colors.ts';

// The profile photo has no backend counterpart — it stays device-local.
const STORAGE_KEY_PHOTO = 'profile_photo';

function Profile() {
    const {t} = useTranslation();
    const player = useAuthStore(s => s.player);
    const stats = useAuthStore(s => s.stats);
    const setSession = useAuthStore(s => s.setSession);

    const [photoUri,      setPhotoUri]      = useState<string>('');
    const [sheetVisible,  setSheetVisible]  = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [nameInput,     setNameInput]     = useState('');
    const [savingName,    setSavingName]    = useState(false);

    const isGuest = player?.accountType === 'guest';
    const displayName = player?.username || 'Player';

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
            offlineAccess: true,
        });

        (async () => {
            const savedPhoto = await AsyncStorage.getItem(STORAGE_KEY_PHOTO);
            if (savedPhoto) setPhotoUri(savedPhoto);
        })();
    }, []);

    // Keep the editable name field in sync with the server username.
    useEffect(() => {
        setNameInput(player?.username || '');
    }, [player?.username]);

    // ── Auth: upgrade a guest account ───────────────────────

    async function signInWithGoogle() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo: any = await GoogleSignin.signIn();

            let idToken: string | undefined =
                userInfo?.data?.idToken ?? userInfo?.idToken;
            if (!idToken) {
                const tokens = await GoogleSignin.getTokens();
                idToken = tokens?.idToken;
            }
            if (!idToken) throw new Error('Could not obtain Google ID token');

            // Links the Google identity onto the current guest account and
            // merges its progress server-side.
            await authService.linkGoogle(idToken);
            await setSession();
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
            if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('', 'Login already in progress');
            } else {
                Alert.alert('Sign-in failed', error?.message ?? 'Please try again');
            }
        }
    }

    async function signInWithApple() {
        if (!appleAuth.isSupported) {
            Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS 13+.');
            return;
        }
        try {
            const resp = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            if (!resp.identityToken) throw new Error('No identity token from Apple');

            // Links the Apple identity onto the current guest account.
            await authService.linkApple(resp.identityToken);
            await setSession();
        } catch (error: any) {
            if (error?.code === appleAuth.Error.CANCELED) return;
            Alert.alert('Sign-in failed', error?.message ?? 'Please try again');
        }
    }

    // ── Username (server-owned) ─────────────────────────────

    async function handleSaveName() {
        const next = nameInput.trim();
        if (!next || next === player?.username) return;
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(next)) {
            Alert.alert('Invalid name', 'Use 3–32 letters, numbers or underscores.');
            return;
        }
        setSavingName(true);
        try {
            await userService.updateProfile(next);
            await setSession();
            Keyboard.dismiss();
        } catch (error: any) {
            Alert.alert('Could not save', error?.message ?? 'Please try again');
        } finally {
            setSavingName(false);
        }
    }

    // ── Photo (device-local) ────────────────────────────────

    async function handlePickResult(uri: string) {
        setPhotoUri(uri);
        await AsyncStorage.setItem(STORAGE_KEY_PHOTO, uri);
        setSheetVisible(false);
    }

    function handleCamera() {
        setSheetVisible(false);
        setTimeout(() => setCameraVisible(true), 350);
    }

    function handleCameraCapture(uri: string) {
        setCameraVisible(false);
        setPhotoUri(uri);
        AsyncStorage.setItem(STORAGE_KEY_PHOTO, uri);
    }

    function handleGallery() {
        launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) handlePickResult(uri);
        });
    }

    const nameChanged = nameInput.trim() !== (player?.username || '');

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

                            <Text allowFontScaling={false} style={styles.guestName}>👻 Guest Player</Text>
                            <Text allowFontScaling={false} style={styles.guestHint}>
                                Sign in to save your progress
                            </Text>

                            {/* Divider */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text allowFontScaling={false} style={styles.dividerText}>Sign in with</Text>
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
                                            <Text allowFontScaling={false} style={styles.cameraIcon}>📷</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <Text allowFontScaling={false} style={styles.changePhotoText}>{t('changePhoto')}</Text>
                            </View>

                            <Text allowFontScaling={false} style={styles.greeting}>Hello, {displayName}!</Text>

                            {/* Editable, server-owned username */}
                            <View style={styles.inputCard}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>✏️  Name</Text>
                                <TextInput
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor={VIOLET}
                                    autoCapitalize="none"
                                    maxLength={32}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSaveName}
                                    accessibilityLabel="Username input field"
                                />
                                <TouchableOpacity
                                    onPress={handleSaveName}
                                    disabled={!nameChanged || savingName}
                                    activeOpacity={0.8}
                                    style={[saveBtn, (!nameChanged || savingName) && {opacity: 0.4}]}
                                >
                                    {savingName
                                        ? <ActivityIndicator size="small" color="#fff"/>
                                        : <Text allowFontScaling={false} style={saveBtnText}>Save</Text>}
                                </TouchableOpacity>
                            </View>

                            {/* Read-only server stats */}
                            <View style={[styles.inputCard, {marginTop: 14}]}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>📊  Stats</Text>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>Account type</Text>
                                    <Text allowFontScaling={false} style={statVal}>{player?.accountType ?? '—'}</Text>
                                </View>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>High score</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.highScore ?? 0}</Text>
                                </View>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>Games played</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.totalGames ?? 0}</Text>
                                </View>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>Coins</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.coins ?? 0}</Text>
                                </View>
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

            <CameraModal
                visible={cameraVisible}
                onCapture={handleCameraCapture}
                onClose={() => setCameraVisible(false)}
            />
        </LinearGradient>
    );
}

// Local style objects for the Save button + read-only stat rows.
const saveBtn = {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center' as const,
};
const saveBtnText = {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
};
const statRow = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
};
const statKey = {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600' as const,
};
const statVal = {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800' as const,
};

export default Profile;
