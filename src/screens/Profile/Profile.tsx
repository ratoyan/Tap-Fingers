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
import {storage} from '../../db/kvStore.ts';

// services / store
import * as authService from '../../services/authService.ts';
import * as userService from '../../services/userService.ts';
import {useAuthStore} from '../../store/authStore.ts';

// components
import BackHeader from '../../components/ui/BackHeader/BackHeader.tsx';
import PhotoPickerSheet from '../../components/ui/PhotoPickerSheet/PhotoPickerSheet.tsx';
import CameraModal from '../../components/ui/CameraModal/CameraModal.tsx';
import GuestAuthModal, {GuestAuthMode} from '../../components/ui/GuestAuthModal/GuestAuthModal.tsx';
import Ghost from '../../assets/icons/Ghost.tsx';

// data
import {avatarForId} from '../../data/avatars.ts';
import {useKeyboardAwareScroll} from '../../hooks/useKeyboardAwareScroll.ts';

// styles
import styles from './Profile.style.ts';
import {GRADIENT_LIGHT, PURPLE, PURPLE_DARK, VIOLET} from '../../constants/colors.ts';
import ScreenStatusBar from '../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx';

// Extra bottom padding added on top of the keyboard height while it is open.
const KEYBOARD_EXTRA_PADDING = 220;
// How much room to keep free *below* the focused field when scrolling it clear
// of the keyboard. The default 48 only clears the field itself, which is too
// little here: the confirm-email card carries the "Confirm" button and the
// "Resend code" link underneath its code box, and with the number pad up they
// both ended up behind the keys. Sized to cover that pair.
const KEYBOARD_REVEAL_OFFSET = 165;

function Profile() {
    const {t} = useTranslation();
    const navigation = useNavigation<any>();
    const player = useAuthStore(s => s.player);
    const stats = useAuthStore(s => s.stats);
    const setSession = useAuthStore(s => s.setSession);
    const refreshProfile = useAuthStore(s => s.refreshProfile);

    // The profile photo is server-stored. `serverAvatar` is the authoritative
    // URL from the backend; `localPreview` shows the just-picked image instantly
    // while the upload is in flight, then clears once the server copy is live.
    const serverAvatar = userService.resolveAvatarUrl(player);
    const [localPreview,   setLocalPreview]   = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const shownPhoto = localPreview || serverAvatar || '';

    const [sheetVisible,  setSheetVisible]  = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [nameInput,     setNameInput]     = useState('');
    const [savingName,    setSavingName]    = useState(false);

    // Guest account block — the sign-up / sign-in form lives in a bottom sheet
    // so this screen stays a short summary. `authMode` picks which form it opens
    // on; the sheet itself owns the fields and can switch modes from inside.
    const [authModal, setAuthModal] = useState(false);
    const [authMode,  setAuthMode]  = useState<GuestAuthMode>('register');

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

    // Email confirmation
    const [verifyCode, setVerifyCode] = useState('');
    const [verifying,  setVerifying]  = useState(false);
    const [resending,  setResending]  = useState(false);

    const isGuest = player?.accountType === 'guest';
    const isEmailAccount = player?.accountType === 'email';
    // Email accounts that haven't confirmed their address yet.
    const needsEmailVerify = isEmailAccount && player?.emailVerified === false;
    // A guest that has entered an email but not yet confirmed it — stays a guest
    // (per the backend) until the code is verified, so we show the confirm card
    // inside the guest view rather than the sign-up form.
    const guestPendingEmail = isGuest && !!player?.email && player?.emailVerified === false;
    const displayName = player?.username || 'Player';
    // Stable per-user avatar, shown when no photo has been uploaded.
    const avatar = avatarForId(player?.id);

    // Keep the focused input above the keyboard (edge-to-edge disables the
    // native resize on Android SDK 36 / RN 0.84, so we handle it in JS).
    const {scrollRef, keyboardHeight, onScroll, onInputFocus} = useKeyboardAwareScroll(KEYBOARD_REVEAL_OFFSET);
    // Bottom room while the keyboard is up: the keyboard's own height (it overlaps
    // the view under edge-to-edge) plus a breathing gap, so the lowest card and its
    // button can still be scrolled clear of the keys instead of sitting flush on them.
    const keyboardSpacerStyle =
        keyboardHeight > 0 ? {paddingBottom: keyboardHeight + KEYBOARD_EXTRA_PADDING} : null;

    // Keep the editable name field in sync with the server username.
    useEffect(() => {
        setNameInput(player?.username || '');
    }, [player?.username]);

    // ── Auth: upgrade a guest account ───────────────────────

    function openAuthModal(mode: GuestAuthMode) {
        setAuthMode(mode);
        setAuthModal(true);
    }

    // The guest was upgraded in place, keeping its progress. It stays a guest
    // server-side until the email is confirmed, so the verify card takes over
    // the guest view once the session refreshes.
    async function handleRegistered(email: string) {
        setAuthModal(false);
        await setSession();
        notice.success(t('confirmEmail'), t('confirmEmailHint', {email}));
    }

    // The guest signed into a different, already-existing account — reset to
    // Home so the whole app reflects the new account cleanly.
    async function handleLoggedIn() {
        setAuthModal(false);
        await setSession();
        notice.success(t('welcomeBack'), t('signedInMsg'));
        navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }

    // ── Username (server-owned) ─────────────────────────────

    async function handleSaveName() {
        const next = nameInput.trim();
        if (!next || next === player?.username) return;
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(next)) {
            notice.error(t('invalidName'), t('invalidNameMsg'));
            return;
        }
        setSavingName(true);
        try {
            await userService.updateProfile(next);
            await setSession();
            Keyboard.dismiss();
            notice.success(t('saved'), t('nameUpdatedMsg'));
        } catch (error: any) {
            notice.error(t('couldNotSave'), error?.message ?? t('tryAgain'));
        } finally {
            setSavingName(false);
        }
    }

    // ── Email / password (email accounts only) ──────────────

    async function handleChangeEmail() {
        if (savingEmail) return;
        const email = newEmail.trim();
        if (emailPwd.length < 6) {
            notice.error(t('passwordRequired'), t('enterCurrentPassword'));
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            notice.error(t('invalidEmail'), t('invalidEmailMsg'));
            return;
        }
        setSavingEmail(true);
        try {
            await userService.changeEmail(emailPwd, email);
            await setSession();
            setEmailPwd('');
            setNewEmail('');
            Keyboard.dismiss();
            notice.success(t('saved'), t('emailUpdatedMsg'));
        } catch (error: any) {
            notice.error(t('couldNotUpdate'), error?.message ?? t('tryAgain'));
        } finally {
            setSavingEmail(false);
        }
    }

    async function handleChangePassword() {
        if (savingPwd) return;
        if (curPwd.length < 6) {
            notice.error(t('passwordRequired'), t('enterCurrentPassword'));
            return;
        }
        if (newPwd.length < 6) {
            notice.error(t('weakPassword'), t('weakPasswordMsg'));
            return;
        }
        setSavingPwd(true);
        try {
            await userService.changePassword(curPwd, newPwd);
            setCurPwd('');
            setNewPwd('');
            Keyboard.dismiss();
            notice.success(t('saved'), t('passwordUpdatedMsg'));
        } catch (error: any) {
            notice.error(t('couldNotUpdate'), error?.message ?? t('tryAgain'));
        } finally {
            setSavingPwd(false);
        }
    }

    // ── Email confirmation ──────────────────────────────────

    async function handleVerifyEmail() {
        if (verifying) return;
        if (verifyCode.trim().length !== 6) {
            notice.error(t('checkDetails'), t('enterCode6'));
            return;
        }
        setVerifying(true);
        try {
            await authService.verifyEmail(verifyCode.trim());
            await setSession();
            setVerifyCode('');
            Keyboard.dismiss();
            notice.success(t('emailConfirmed'), t('emailConfirmedMsg'));
        } catch (error: any) {
            notice.error(t('couldNotUpdate'), error?.message ?? t('tryAgain'));
        } finally {
            setVerifying(false);
        }
    }

    async function handleResendCode() {
        if (resending) return;
        setResending(true);
        try {
            await authService.resendVerification();
            notice.success(t('codeSent'), t('codeSentMsg'));
        } catch (error: any) {
            notice.error(t('couldNotUpdate'), error?.message ?? t('tryAgain'));
        } finally {
            setResending(false);
        }
    }

    // ── Delete account ──────────────────────────────────────

    async function handleDeleteAccount() {
        if (deleting) return;
        if (isEmailAccount && deletePassword.length < 6) {
            notice.error(t('passwordRequired'), t('enterPasswordToDelete'));
            return;
        }
        setDeleting(true);
        try {
            await userService.deleteAccount(isEmailAccount ? deletePassword : undefined);
            // Clear the session + device-local data, then drop back to Welcome.
            await useAuthStore.getState().logout();
            await storage.clear();
            setDeleteModal(false);
            navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
        } catch (error: any) {
            notice.error(t('couldNotDelete'), error?.message ?? t('tryAgain'));
            setDeleting(false);
        }
    }

    // ── Photo (device-local) ────────────────────────────────

    // Uploads the picked/captured image to the backend, showing it immediately
    // as an optimistic preview and refreshing the profile once it's stored.
    async function changeAvatar(uri: string) {
        if (uploadingPhoto) return;
        setSheetVisible(false);
        setLocalPreview(uri);
        setUploadingPhoto(true);
        try {
            await userService.uploadAvatar(uri);
            await refreshProfile();
            setLocalPreview('');
            notice.success(t('saved'), t('photoUpdatedMsg'));
        } catch (error: any) {
            setLocalPreview('');
            notice.error(t('couldNotSave'), error?.message ?? t('tryAgain'));
        } finally {
            setUploadingPhoto(false);
        }
    }

    function handleCamera() {
        setSheetVisible(false);
        setTimeout(() => setCameraVisible(true), 350);
    }

    function handleCameraCapture(uri: string) {
        setCameraVisible(false);
        changeAvatar(uri);
    }

    function handleGallery() {
        launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) changeAvatar(uri);
        });
    }

    const nameChanged = nameInput.trim() !== (player?.username || '');

    // Confirm-email card — shared by the guest (pending) and email (unverified) views.
    function renderVerifyCard() {
        return (
            <View style={[styles.inputCard, styles.verifyCard, {marginBottom: 14}]}>
                <Text allowFontScaling={false} style={styles.inputLabel}>📧  {t('confirmEmail')}</Text>
                <Text allowFontScaling={false} style={styles.verifyHint}>
                    {t('confirmEmailHint', {email: player?.email ?? ''})}
                </Text>
                <TextInput
                    value={verifyCode}
                    onChangeText={(v) => setVerifyCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                    style={[styles.accountInput, {textAlign: 'center', letterSpacing: 6, fontSize: 22}]}
                    placeholder="••••••"
                    placeholderTextColor={VIOLET}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={onInputFocus}
                    editable={!verifying}
                    allowFontScaling={false}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyEmail}
                />
                <TouchableOpacity
                    onPress={handleVerifyEmail}
                    disabled={verifying}
                    activeOpacity={0.8}
                    style={[saveBtn, verifying && {opacity: 0.4}]}
                >
                    {verifying
                        ? <ActivityIndicator size="small" color="#fff"/>
                        : <Text allowFontScaling={false} style={saveBtnText}>{t('confirm')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResendCode} disabled={resending} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text allowFontScaling={false} style={styles.resendText}>
                        {resending ? t('loading') : t('resendCode')}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Render ──────────────────────────────────────────────

    return (
        <LinearGradient
            colors={[PURPLE_DARK, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Profile screen"
        >
            <ScreenStatusBar/>

            <BackHeader title={`👨‍🎓 ${t('profile')}`} />

            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollRef}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={[styles.scrollContainer, keyboardSpacerStyle]}
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

                            <Text allowFontScaling={false} style={styles.guestName}>👻 {t('guestPlayer')}</Text>
                            {!!player?.username && (
                                <Text allowFontScaling={false} style={styles.guestUsername}>{player.username}</Text>
                            )}
                            {!!player?.guestId && (
                                <Text allowFontScaling={false} style={styles.guestIdText} selectable>
                                    ID: {player.guestId}
                                </Text>
                            )}
                            <Text allowFontScaling={false} style={styles.guestHint}>
                                {t('guestSaveHint')}
                            </Text>

                            {/* A guest with a pending email confirms it here (and only
                                then becomes a real account); otherwise the two
                                buttons that open the sign-up / sign-in sheet. */}
                            {guestPendingEmail ? renderVerifyCard() : (
                                <View style={styles.authButtons}>
                                    <TouchableOpacity
                                        style={styles.primaryAuthButton}
                                        onPress={() => openAuthModal('register')}
                                        activeOpacity={0.85}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('createAccount')}
                                    >
                                        <LinearGradient
                                            colors={[PURPLE_DARK, GRADIENT_LIGHT]}
                                            start={{x: 0, y: 0}}
                                            end={{x: 1, y: 1}}
                                            style={styles.primaryAuthGradient}
                                        >
                                            <Text allowFontScaling={false} style={styles.primaryAuthText}>
                                                ✨  {t('createAccount')}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View style={styles.dividerRow}>
                                        <View style={styles.dividerLine} />
                                        <Text allowFontScaling={false} style={styles.dividerText}>{t('or')}</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.secondaryAuthButton}
                                        onPress={() => openAuthModal('login')}
                                        activeOpacity={0.85}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('signIn')}
                                    >
                                        <Text allowFontScaling={false} style={styles.secondaryAuthText}>
                                            👋  {t('signIn')}
                                        </Text>
                                    </TouchableOpacity>

                                    <Text allowFontScaling={false} style={styles.formFootnote}>
                                        🔒 {t('progressSafeNote')}
                                    </Text>
                                </View>
                            )}

                            {/* Delete guest account — wipes this guest session and its progress */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => { setDeletePassword(''); setDeleteModal(true); }}
                                activeOpacity={0.85}
                            >
                                <Text allowFontScaling={false} style={styles.deleteButtonText}>🗑  {t('deleteAccount')}</Text>
                            </TouchableOpacity>
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
                                        {shownPhoto ? (
                                            <Image
                                                source={{uri: shownPhoto}}
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
                                        {uploadingPhoto ? (
                                            <View style={[styles.cameraOverlay, styles.avatarUploading]}>
                                                <ActivityIndicator size="small" color="#fff" />
                                            </View>
                                        ) : (
                                            <View style={styles.cameraOverlay}>
                                                <Text allowFontScaling={false} style={styles.cameraIcon}>📷</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <Text allowFontScaling={false} style={styles.changePhotoText}>{t('changePhoto')}</Text>
                            </View>

                            <Text allowFontScaling={false} style={styles.greeting}>{t('greeting', {name: displayName})}</Text>

                            {/* Confirm email — shown only for unverified email accounts */}
                            {needsEmailVerify && renderVerifyCard()}

                            {/* Editable, server-owned username */}
                            <View style={styles.inputCard}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>✏️  {t('name')}</Text>
                                <TextInput
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    style={styles.input}
                                    placeholder={t('enterYourName')}
                                    placeholderTextColor={VIOLET}
                                    autoCapitalize="none"
                                    maxLength={32}
                                    returnKeyType="done"
                                    onFocus={onInputFocus}
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
                                        : <Text allowFontScaling={false} style={saveBtnText}>{t('save')}</Text>}
                                </TouchableOpacity>
                            </View>

                            {/* Read-only server stats */}
                            <View style={[styles.inputCard, {marginTop: 14}]}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>📊  {t('stats')}</Text>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>{t('accountType')}</Text>
                                    <Text allowFontScaling={false} style={statVal}>{player?.accountType ?? '—'}</Text>
                                </View>
                                {!!player?.email && (
                                    <View style={statRow}>
                                        <Text allowFontScaling={false} style={statKey}>{t('email')}</Text>
                                        <Text allowFontScaling={false} style={statVal} numberOfLines={1}>{player.email}</Text>
                                    </View>
                                )}
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>{t('highScore')}</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.highScore ?? 0}</Text>
                                </View>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>{t('gamesPlayed')}</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.totalGames ?? 0}</Text>
                                </View>
                                <View style={statRow}>
                                    <Text allowFontScaling={false} style={statKey}>{t('coins')}</Text>
                                    <Text allowFontScaling={false} style={statVal}>{stats?.coins ?? 0}</Text>
                                </View>
                            </View>

                            {/* Change email — email accounts only */}
                            {isEmailAccount && (
                                <View style={[styles.inputCard, {marginTop: 14}]}>
                                    <Text allowFontScaling={false} style={styles.inputLabel}>✉️  {t('changeEmail')}</Text>
                                    <TextInput
                                        value={emailPwd}
                                        onChangeText={setEmailPwd}
                                        style={styles.accountInput}
                                        placeholder={t('currentPassword')}
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingEmail}
                                        allowFontScaling={false}
                                        onFocus={onInputFocus}
                                    />
                                    <TextInput
                                        value={newEmail}
                                        onChangeText={setNewEmail}
                                        style={styles.accountInput}
                                        placeholder={t('newEmail')}
                                        placeholderTextColor={VIOLET}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingEmail}
                                        allowFontScaling={false}
                                        returnKeyType="done"
                                        onFocus={onInputFocus}
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
                                            : <Text allowFontScaling={false} style={saveBtnText}>{t('updateEmail')}</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Change password — email accounts only */}
                            {isEmailAccount && (
                                <View style={[styles.inputCard, {marginTop: 14}]}>
                                    <Text allowFontScaling={false} style={styles.inputLabel}>🔒  {t('changePassword')}</Text>
                                    <TextInput
                                        value={curPwd}
                                        onChangeText={setCurPwd}
                                        style={styles.accountInput}
                                        placeholder={t('currentPassword')}
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingPwd}
                                        allowFontScaling={false}
                                        onFocus={onInputFocus}
                                    />
                                    <TextInput
                                        value={newPwd}
                                        onChangeText={setNewPwd}
                                        style={styles.accountInput}
                                        placeholder={t('newPassword')}
                                        placeholderTextColor={VIOLET}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!savingPwd}
                                        allowFontScaling={false}
                                        returnKeyType="done"
                                        onFocus={onInputFocus}
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
                                            : <Text allowFontScaling={false} style={saveBtnText}>{t('updatePassword')}</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Delete account — bottom, danger zone */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => { setDeletePassword(''); setDeleteModal(true); }}
                                activeOpacity={0.85}
                            >
                                <Text allowFontScaling={false} style={styles.deleteButtonText}>🗑  {t('deleteAccount')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {isGuest && (
                <GuestAuthModal
                    visible={authModal}
                    mode={authMode}
                    onClose={() => setAuthModal(false)}
                    onRegistered={handleRegistered}
                    onLoggedIn={handleLoggedIn}
                />
            )}

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
                    onPressIn={() => !deleting && setDeleteModal(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalAvoider}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                    <Pressable style={styles.modalCard} onPressIn={() => {}}>
                        <Text allowFontScaling={false} style={styles.modalTitle}>⚠️ {t('deleteAccountQuestion')}</Text>
                        <Text allowFontScaling={false} style={styles.modalMessage}>
                            {t('deleteAccountWarning')}
                        </Text>

                        {isEmailAccount && (
                            <TextInput
                                style={styles.modalInput}
                                placeholder={t('enterYourPassword')}
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
                                onPressIn={() => setDeleteModal(false)}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                <Text allowFontScaling={false} style={styles.modalCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalDelete]}
                                onPressIn={handleDeleteAccount}
                                disabled={deleting}
                                activeOpacity={0.85}
                            >
                                {deleting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text allowFontScaling={false} style={styles.modalDeleteText}>{t('delete')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                    </KeyboardAvoidingView>
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
