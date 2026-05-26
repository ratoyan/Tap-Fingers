import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    ActivityIndicator,
} from 'react-native';
import {notice} from '../../utils/notice.ts';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/core';
import LinearGradient from 'react-native-linear-gradient';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// services / store
import * as authService from '../../services/authService.ts';
import * as userService from '../../services/userService.ts';
import {useAuthStore} from '../../store/authStore.ts';

// components
import BackHeader from '../../components/ui/BackHeader/BackHeader.tsx';
import PhotoPickerSheet from '../../components/ui/PhotoPickerSheet/PhotoPickerSheet.tsx';
import CameraModal from '../../components/ui/CameraModal/CameraModal.tsx';
import Ghost from '../../assets/icons/Ghost.tsx';

// data
import {avatarForId} from '../../data/avatars.ts';

// styles
import styles from './Profile.style.ts';
import {GRADIENT_LIGHT, ORCHID, PURPLE, PURPLE_DARK, VIOLET} from '../../constants/colors.ts';

// The profile photo has no backend counterpart — it stays device-local.
const STORAGE_KEY_PHOTO = 'profile_photo';

function Profile() {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const player = useAuthStore(s => s.player);
    const stats = useAuthStore(s => s.stats);
    const setSession = useAuthStore(s => s.setSession);

    const [photoUri,      setPhotoUri]      = useState<string>('');
    const [sheetVisible,  setSheetVisible]  = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [nameInput,     setNameInput]     = useState('');
    const [savingName,    setSavingName]    = useState(false);

    // Guest → email/password sign-up form
    const [regName,     setRegName]     = useState('');
    const [regEmail,    setRegEmail]    = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [linking,     setLinking]     = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

    // Change email (email accounts only)
    const [emailPwd,    setEmailPwd]    = useState('');
    const [newEmail,    setNewEmail]    = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    // Change password (email accounts only)
    const [curPwd,    setCurPwd]    = useState('');
    const [newPwd,    setNewPwd]    = useState('');
    const [savingPwd, setSavingPwd] = useState(false);

    // Delete account
    const [deleteModal,    setDeleteModal]    = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting,       setDeleting]       = useState(false);

    const isGuest = player?.accountType === 'guest';
    const isEmailAccount = player?.accountType === 'email';
    const displayName = player?.username || 'Player';
    // Stable per-user avatar, shown when no photo has been uploaded.
    const avatar = avatarForId(player?.id);

    useEffect(() => {
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

    // Mirrors the backend validators (tapfingers-server auth.validator):
    // username 3-32 alphanumeric/underscore, valid email, password 6-72.
    function validateRegistration(): string | null {
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(regName.trim())) {
            return 'Name must be 3-32 letters, numbers or underscores';
        }
        if (!/^\S+@\S+\.\S+$/.test(regEmail.trim())) {
            return 'Please enter a valid email address';
        }
        if (regPassword.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return null;
    }

    async function handleEmailSignUp() {
        if (linking) return;
        const validationError = validateRegistration();
        if (validationError) {
            notice.error('Check your details', validationError);
            return;
        }
        setLinking(true);
        try {
            // Upgrades the current guest account to an email/password account,
            // keeping all of the guest's progress server-side.
            await authService.linkEmail(regName.trim(), regEmail.trim(), regPassword);
            Keyboard.dismiss();
            await setSession();
            notice.success('Welcome!', 'Your progress is now saved to your account.');
        } catch (error: any) {
            notice.error('Sign-up failed', error?.message ?? 'Please try again');
        } finally {
            setLinking(false);
        }
    }

    // ── Username (server-owned) ─────────────────────────────

    async function handleSaveName() {
        const next = nameInput.trim();
        if (!next || next === player?.username) return;
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(next)) {
            notice.error('Invalid name', 'Use 3–32 letters, numbers or underscores.');
            return;
        }
        setSavingName(true);
        try {
            await userService.updateProfile(next);
            await setSession();
            Keyboard.dismiss();
            notice.success('Saved', 'Your name has been updated.');
        } catch (error: any) {
            notice.error('Could not save', error?.message ?? 'Please try again');
        } finally {
            setSavingName(false);
        }
    }

    // ── Email / password (email accounts only) ──────────────

    async function handleChangeEmail() {
        if (savingEmail) return;
        const email = newEmail.trim();
        if (emailPwd.length < 6) {
            notice.error('Password required', 'Enter your current password.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            notice.error('Invalid email', 'Please enter a valid email address.');
            return;
        }
        setSavingEmail(true);
        try {
            await userService.changeEmail(emailPwd, email);
            await setSession();
            setEmailPwd('');
            setNewEmail('');
            Keyboard.dismiss();
            notice.success('Saved', 'Your email has been updated.');
        } catch (error: any) {
            notice.error('Could not update', error?.message ?? 'Please try again');
        } finally {
            setSavingEmail(false);
        }
    }

    async function handleChangePassword() {
        if (savingPwd) return;
        if (curPwd.length < 6) {
            notice.error('Password required', 'Enter your current password.');
            return;
        }
        if (newPwd.length < 6) {
            notice.error('Weak password', 'New password must be at least 6 characters.');
            return;
        }
        setSavingPwd(true);
        try {
            await userService.changePassword(curPwd, newPwd);
            setCurPwd('');
            setNewPwd('');
            Keyboard.dismiss();
            notice.success('Saved', 'Your password has been updated.');
        } catch (error: any) {
            notice.error('Could not update', error?.message ?? 'Please try again');
        } finally {
            setSavingPwd(false);
        }
    }

    // ── Delete account ──────────────────────────────────────

    async function handleDeleteAccount() {
        if (deleting) return;
        if (isEmailAccount && deletePassword.length < 6) {
            notice.error('Password required', 'Enter your password to delete your account.');
            return;
        }
        setDeleting(true);
        try {
            await userService.deleteAccount(isEmailAccount ? deletePassword : undefined);
            // Clear the session + device-local data, then drop back to Welcome.
            await useAuthStore.getState().logout();
            await AsyncStorage.clear();
            setDeleteModal(false);
            navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
        } catch (error: any) {
            notice.error('Could not delete', error?.message ?? 'Please try again');
            setDeleting(false);
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
            colors={[PURPLE_DARK, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Profile screen"
        >
            <BackHeader title={`👨‍🎓 ${t('profile')}`} />

            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >

                    {isGuest ? (
                        /* ── Guest view ──────────────────────── */
                        <View style={styles.guestSection}>
                            <View style={styles.ghostAvatarWrap}>
                                <Ghost size={110} color="rgba(255,255,255,0.9)" eyeColor="#6a0dad" />
                            </View>

                            <Text allowFontScaling={false} style={styles.guestName}>👻 Guest Player</Text>
                            <Text allowFontScaling={false} style={styles.guestHint}>
                                Create an account to save your progress
                            </Text>

                            {/* Email sign-up form */}
                            <View style={styles.guestForm}>
                                <Text allowFontScaling={false} style={styles.formTitle}>✨ Create your account</Text>

                                <View style={[styles.fieldRow, focusedField === 'name' && styles.fieldRowFocused]}>
                                    <Text allowFontScaling={false} style={styles.fieldIcon}>👤</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder="Name"
                                        placeholderTextColor="rgba(255,255,255,0.45)"
                                        value={regName}
                                        onChangeText={setRegName}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!linking}
                                        allowFontScaling={false}
                                        returnKeyType="next"
                                    />
                                </View>

                                <View style={[styles.fieldRow, focusedField === 'email' && styles.fieldRowFocused]}>
                                    <Text allowFontScaling={false} style={styles.fieldIcon}>✉️</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder="Email"
                                        placeholderTextColor="rgba(255,255,255,0.45)"
                                        value={regEmail}
                                        onChangeText={setRegEmail}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!linking}
                                        allowFontScaling={false}
                                        returnKeyType="next"
                                    />
                                </View>

                                <View style={[styles.fieldRow, focusedField === 'password' && styles.fieldRowFocused]}>
                                    <Text allowFontScaling={false} style={styles.fieldIcon}>🔒</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder="Password"
                                        placeholderTextColor="rgba(255,255,255,0.45)"
                                        value={regPassword}
                                        onChangeText={setRegPassword}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!linking}
                                        allowFontScaling={false}
                                        returnKeyType="done"
                                        onSubmitEditing={handleEmailSignUp}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.linkButton}
                                    onPress={handleEmailSignUp}
                                    disabled={linking}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={[ORCHID, VIOLET]}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 1}}
                                        style={styles.linkButtonGradient}
                                    >
                                        {linking
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text allowFontScaling={false} style={styles.linkButtonText}>Create Account</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <Text allowFontScaling={false} style={styles.formFootnote}>
                                    🔒 Your progress stays safe and synced
                                </Text>
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
                                            <LinearGradient
                                                colors={avatar.colors}
                                                start={{x: 0, y: 0}}
                                                end={{x: 1, y: 1}}
                                                style={[styles.avatar, styles.avatarPlaceholder]}
                                            >
                                                <Text allowFontScaling={false} style={styles.avatarEmoji}>
                                                    {avatar.emoji}
                                                </Text>
                                            </LinearGradient>
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
                                {!!player?.email && (
                                    <View style={statRow}>
                                        <Text allowFontScaling={false} style={statKey}>Email</Text>
                                        <Text allowFontScaling={false} style={statVal} numberOfLines={1}>{player.email}</Text>
                                    </View>
                                )}
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

                            {/* Change email — email accounts only */}
                            {isEmailAccount && (
                                <View style={[styles.inputCard, {marginTop: 14}]}>
                                    <Text allowFontScaling={false} style={styles.inputLabel}>✉️  Change Email</Text>
                                    <TextInput
                                        value={emailPwd}
                                        onChangeText={setEmailPwd}
                                        style={styles.accountInput}
                                        placeholder="Current password"
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingEmail}
                                        allowFontScaling={false}
                                    />
                                    <TextInput
                                        value={newEmail}
                                        onChangeText={setNewEmail}
                                        style={styles.accountInput}
                                        placeholder="New email"
                                        placeholderTextColor={VIOLET}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingEmail}
                                        allowFontScaling={false}
                                        returnKeyType="done"
                                        onSubmitEditing={handleChangeEmail}
                                    />
                                    <TouchableOpacity
                                        onPress={handleChangeEmail}
                                        disabled={savingEmail}
                                        activeOpacity={0.8}
                                        style={[saveBtn, savingEmail && {opacity: 0.4}]}
                                    >
                                        {savingEmail
                                            ? <ActivityIndicator size="small" color="#fff"/>
                                            : <Text allowFontScaling={false} style={saveBtnText}>Update Email</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Change password — email accounts only */}
                            {isEmailAccount && (
                                <View style={[styles.inputCard, {marginTop: 14}]}>
                                    <Text allowFontScaling={false} style={styles.inputLabel}>🔒  Change Password</Text>
                                    <TextInput
                                        value={curPwd}
                                        onChangeText={setCurPwd}
                                        style={styles.accountInput}
                                        placeholder="Current password"
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingPwd}
                                        allowFontScaling={false}
                                    />
                                    <TextInput
                                        value={newPwd}
                                        onChangeText={setNewPwd}
                                        style={styles.accountInput}
                                        placeholder="New password"
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingPwd}
                                        allowFontScaling={false}
                                        returnKeyType="done"
                                        onSubmitEditing={handleChangePassword}
                                    />
                                    <TouchableOpacity
                                        onPress={handleChangePassword}
                                        disabled={savingPwd}
                                        activeOpacity={0.8}
                                        style={[saveBtn, savingPwd && {opacity: 0.4}]}
                                    >
                                        {savingPwd
                                            ? <ActivityIndicator size="small" color="#fff"/>
                                            : <Text allowFontScaling={false} style={saveBtnText}>Update Password</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Delete account — bottom, danger zone */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => { setDeletePassword(''); setDeleteModal(true); }}
                                activeOpacity={0.85}
                            >
                                <Text allowFontScaling={false} style={styles.deleteButtonText}>🗑  Delete Account</Text>
                            </TouchableOpacity>
                        </>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

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

            {/* Delete account confirmation */}
            {deleteModal && (
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => !deleting && setDeleteModal(false)}
                >
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <Text allowFontScaling={false} style={styles.modalTitle}>⚠️ Delete account?</Text>
                        <Text allowFontScaling={false} style={styles.modalMessage}>
                            This permanently deletes your account and all of your progress. This cannot be undone.
                        </Text>

                        {isEmailAccount && (
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter your password"
                                placeholderTextColor="rgba(255,255,255,0.45)"
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!deleting}
                                allowFontScaling={false}
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancel]}
                                onPress={() => setDeleteModal(false)}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                <Text allowFontScaling={false} style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalDelete]}
                                onPress={handleDeleteAccount}
                                disabled={deleting}
                                activeOpacity={0.85}
                            >
                                {deleting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text allowFontScaling={false} style={styles.modalDeleteText}>Delete</Text>}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            )}
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
