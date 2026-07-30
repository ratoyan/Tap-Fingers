import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
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
import Entrance from '../../components/ui/Entrance/Entrance.tsx';
import PressScale from '../../components/ui/PressScale/PressScale.tsx';
import ProfileHero from '../../components/ui/Profile/ProfileHero.tsx';
import SectionCard from '../../components/ui/Profile/SectionCard.tsx';
import StatTile from '../../components/ui/Profile/StatTile.tsx';

// data
import {avatarForId} from '../../data/avatars.ts';
import {useKeyboardAwareScroll} from '../../hooks/useKeyboardAwareScroll.ts';

// styles
import styles from './Profile.style.ts';
import {CYAN, GOLD, GRADIENT_LIGHT, ORCHID, PURPLE, PURPLE_DARK, VIOLET, WHITE} from '../../constants/colors.ts';
import ScreenStatusBar from '../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx';

// Extra bottom padding added on top of the keyboard height while it is open.
const KEYBOARD_EXTRA_PADDING = 220;
// How much room to keep free *below* the focused field when scrolling it clear
// of the keyboard. The default 48 only clears the field itself, which is too
// little here: the confirm-email card carries the "Confirm" button and the
// "Resend code" link underneath its code box, and with the number pad up they
// both ended up behind the keys. Sized to cover that pair.
const KEYBOARD_REVEAL_OFFSET = 165;

// The screen arrives one block at a time, top to bottom. Small step: the list is
// short, and a longer one turns opening your own profile into waiting for it.
const ENTER_STEP = 70;
// Each stat tile's count-up starts a beat after the one to its left, so the row
// tallies left to right instead of flickering all at once.
const TILE_STEP = 90;

// Which field owns the focus accent. The inputs live in translucent cards where
// a glow would muddy the panel, so focus is drawn on the field's own border.
type FieldKey = 'name' | 'emailPwd' | 'newEmail' | 'curPwd' | 'newPwd' | 'code';

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

    const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

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

    // Every field wires both: the accent state, and the hook that scrolls it
    // clear of the keyboard.
    const focusField = (key: FieldKey) => () => {
        setFocusedField(key);
        onInputFocus();
    };
    const blurField = () => setFocusedField(null);
    const fieldStyle = (key: FieldKey, base: any) => [base, focusedField === key && styles.inputFocused];

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
            <SectionCard icon="📧" title={t('confirmEmail')} tone="alert">
                <Text allowFontScaling={false} style={styles.verifyHint}>
                    {t('confirmEmailHint', {email: player?.email ?? ''})}
                </Text>
                <TextInput
                    value={verifyCode}
                    onChangeText={(v) => setVerifyCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                    style={fieldStyle('code', [styles.accountInput, styles.codeInput])}
                    placeholder="••••••"
                    placeholderTextColor={VIOLET}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={focusField('code')}
                    onBlur={blurField}
                    editable={!verifying}
                    allowFontScaling={false}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyEmail}
                />
                <ActionButton label={t('confirm')} busy={verifying} onPress={handleVerifyEmail} />
                <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resending}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    accessibilityRole="button"
                >
                    <Text allowFontScaling={false} style={styles.resendText}>
                        {resending ? t('loading') : t('resendCode')}
                    </Text>
                </TouchableOpacity>
            </SectionCard>
        );
    }

    // Danger-zone button — same one for guests and signed-in players. Laid out as
    // a row (icon badge · label · chevron) rather than a centred label so it reads
    // as "opens a confirmation", not as a one-tap wipe.
    function renderDeleteButton() {
        return (
            <PressScale
                onPress={() => { setDeletePassword(''); setDeleteModal(true); }}
                style={styles.deleteButton}
                wrapperStyle={styles.deleteButtonWrapper}
                scaleTo={0.97}
                accessibilityLabel={t('deleteAccount')}
            >
                <LinearGradient
                    colors={['rgba(229,72,77,0.30)', 'rgba(229,72,77,0.10)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.deleteGradient}
                >
                    <View style={styles.deleteIconBadge}>
                        <Text allowFontScaling={false} style={styles.deleteIcon}>🗑</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.deleteButtonText} numberOfLines={2}>
                        {t('deleteAccount')}
                    </Text>
                    <Text allowFontScaling={false} style={styles.deleteChevron}>›</Text>
                </LinearGradient>
            </PressScale>
        );
    }

    // ── Render ──────────────────────────────────────────────

    return (
        <LinearGradient
            colors={[PURPLE_DARK, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel={t('profileScreen')}
        >
            <ScreenStatusBar/>

            <BackHeader title={`👨‍🎓 ${t('profile')}`} />

            <KeyboardAvoidingView
                style={styles.flex}
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
                        <>
                            <Entrance from="below" distance={22} style={styles.blockFirst}>
                                <ProfileHero
                                    ghost
                                    name={player?.username || t('guestPlayer')}
                                    chip={t('guestPlayer')}
                                    chipTone="guest"
                                    chipAccessibilityLabel={`${t('accountType')}: ${player?.accountType ?? ''}`}
                                    email={player?.email}
                                    emailVerified={player?.emailVerified !== false}
                                >
                                    {!!player?.guestId && (
                                        <View style={styles.guestIdChip}>
                                            <Text allowFontScaling={false} style={styles.guestIdText} selectable>
                                                {t('idLabel')} {player.guestId}
                                            </Text>
                                        </View>
                                    )}
                                </ProfileHero>
                            </Entrance>

                            {/* A guest with a pending email confirms it here (and only
                                then becomes a real account); otherwise the card that
                                opens the sign-up / sign-in sheet. */}
                            <Entrance delay={ENTER_STEP} from="below" distance={22} style={styles.block}>
                                {guestPendingEmail ? renderVerifyCard() : (
                                    <SectionCard icon="✨" title={t('createYourAccount')}>
                                        <Text allowFontScaling={false} style={styles.guestHint}>
                                            {t('guestSaveHint')}
                                        </Text>

                                        <View style={styles.authButtons}>
                                            <PressScale
                                                onPress={() => openAuthModal('register')}
                                                style={styles.primaryAuthButton}
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
                                            </PressScale>

                                            <View style={styles.dividerRow}>
                                                <View style={styles.dividerLine} />
                                                <Text allowFontScaling={false} style={styles.dividerText}>{t('or')}</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            <PressScale
                                                onPress={() => openAuthModal('login')}
                                                style={styles.secondaryAuthButton}
                                                accessibilityLabel={t('signIn')}
                                            >
                                                <Text allowFontScaling={false} style={styles.secondaryAuthText}>
                                                    👋  {t('signIn')}
                                                </Text>
                                            </PressScale>

                                            <Text allowFontScaling={false} style={styles.formFootnote}>
                                                🔒 {t('progressSafeNote')}
                                            </Text>
                                        </View>
                                    </SectionCard>
                                )}
                            </Entrance>

                            {/* Delete guest account — wipes this guest session and its progress */}
                            <Entrance delay={ENTER_STEP * 2} from="below" distance={22} style={styles.block}>
                                {renderDeleteButton()}
                            </Entrance>
                        </>
                    ) : (
                        /* ── Logged-in view ──────────────────── */
                        <>
                            <Entrance from="below" distance={22} style={styles.blockFirst}>
                                <ProfileHero
                                    eyebrow={t('greeting', {name: displayName})}
                                    name={displayName}
                                    chip={player?.accountType ?? '—'}
                                    chipTone={isEmailAccount ? 'email' : 'social'}
                                    chipAccessibilityLabel={`${t('accountType')}: ${player?.accountType ?? ''}`}
                                    photo={shownPhoto}
                                    fallbackEmoji={avatar.emoji}
                                    fallbackColors={avatar.colors}
                                    uploading={uploadingPhoto}
                                    onPressAvatar={() => setSheetVisible(true)}
                                    photoHint={t('changePhoto')}
                                    email={player?.email}
                                    emailVerified={player?.emailVerified !== false}
                                />
                            </Entrance>

                            {/* The record, as tiles: the numbers roll up on arrival. */}
                            <Entrance delay={ENTER_STEP} from="below" distance={22} style={styles.block}>
                                <View style={styles.statsRow}>
                                    <StatTile
                                        icon="🏆"
                                        label={t('highScore')}
                                        value={stats?.highScore ?? 0}
                                        tint={GOLD}
                                    />
                                    <StatTile
                                        icon="🎮"
                                        label={t('gamesPlayed')}
                                        value={stats?.totalGames ?? 0}
                                        tint={CYAN}
                                        delay={TILE_STEP}
                                    />
                                    <StatTile
                                        icon="🪙"
                                        label={t('coins')}
                                        value={stats?.coins ?? 0}
                                        tint={ORCHID}
                                        delay={TILE_STEP * 2}
                                    />
                                </View>
                            </Entrance>

                            {/* Confirm email — shown only for unverified email accounts */}
                            {needsEmailVerify && (
                                <Entrance delay={ENTER_STEP * 2} from="below" distance={22} style={styles.block}>
                                    {renderVerifyCard()}
                                </Entrance>
                            )}

                            {/* Editable, server-owned username */}
                            <Entrance delay={ENTER_STEP * 3} from="below" distance={22} style={styles.block}>
                                <SectionCard icon="✏️" title={t('name')}>
                                    <TextInput
                                        value={nameInput}
                                        onChangeText={setNameInput}
                                        style={fieldStyle('name', styles.input)}
                                        placeholder={t('enterYourName')}
                                        placeholderTextColor={VIOLET}
                                        autoCapitalize="none"
                                        maxLength={32}
                                        returnKeyType="done"
                                        onFocus={focusField('name')}
                                        onBlur={blurField}
                                        onSubmitEditing={handleSaveName}
                                        accessibilityLabel={t('usernameField')}
                                    />
                                    <View style={styles.actionSpacer} />
                                    <ActionButton
                                        label={t('save')}
                                        busy={savingName}
                                        disabled={!nameChanged}
                                        onPress={handleSaveName}
                                    />
                                </SectionCard>
                            </Entrance>

                            {/* Change email — email accounts only */}
                            {isEmailAccount && (
                                <Entrance delay={ENTER_STEP * 4} from="below" distance={22} style={styles.block}>
                                    <SectionCard icon="✉️" title={t('changeEmail')}>
                                        <TextInput
                                            value={emailPwd}
                                            onChangeText={setEmailPwd}
                                            style={fieldStyle('emailPwd', styles.accountInput)}
                                            placeholder={t('currentPassword')}
                                            placeholderTextColor={VIOLET}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!savingEmail}
                                            allowFontScaling={false}
                                            onFocus={focusField('emailPwd')}
                                            onBlur={blurField}
                                        />
                                        <TextInput
                                            value={newEmail}
                                            onChangeText={setNewEmail}
                                            style={fieldStyle('newEmail', styles.accountInput)}
                                            placeholder={t('newEmail')}
                                            placeholderTextColor={VIOLET}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!savingEmail}
                                            allowFontScaling={false}
                                            returnKeyType="done"
                                            onFocus={focusField('newEmail')}
                                            onBlur={blurField}
                                            onSubmitEditing={handleChangeEmail}
                                        />
                                        <ActionButton
                                            label={t('updateEmail')}
                                            busy={savingEmail}
                                            onPress={handleChangeEmail}
                                        />
                                    </SectionCard>
                                </Entrance>
                            )}

                            {/* Change password — email accounts only */}
                            {isEmailAccount && (
                                <Entrance delay={ENTER_STEP * 5} from="below" distance={22} style={styles.block}>
                                    <SectionCard icon="🔒" title={t('changePassword')}>
                                        <TextInput
                                            value={curPwd}
                                            onChangeText={setCurPwd}
                                            style={fieldStyle('curPwd', styles.accountInput)}
                                            placeholder={t('currentPassword')}
                                            placeholderTextColor={VIOLET}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!savingPwd}
                                            allowFontScaling={false}
                                            onFocus={focusField('curPwd')}
                                            onBlur={blurField}
                                        />
                                        <TextInput
                                            value={newPwd}
                                            onChangeText={setNewPwd}
                                            style={fieldStyle('newPwd', styles.accountInput)}
                                            placeholder={t('newPassword')}
                                            placeholderTextColor={VIOLET}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!savingPwd}
                                            allowFontScaling={false}
                                            returnKeyType="done"
                                            onFocus={focusField('newPwd')}
                                            onBlur={blurField}
                                            onSubmitEditing={handleChangePassword}
                                        />
                                        <ActionButton
                                            label={t('updatePassword')}
                                            busy={savingPwd}
                                            onPress={handleChangePassword}
                                        />
                                    </SectionCard>
                                </Entrance>
                            )}

                            {/* Delete account — bottom, danger zone */}
                            <Entrance delay={ENTER_STEP * 6} from="below" distance={22} style={styles.blockWide}>
                                {renderDeleteButton()}
                            </Entrance>
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

// The one button shape every card ends with: a gradient bar that dips under the
// finger, dims when there's nothing to save, and swaps its label for a spinner
// while the request is in flight.
function ActionButton({
    label,
    onPress,
    busy = false,
    disabled = false,
}: {
    label: string;
    onPress: () => void;
    busy?: boolean;
    disabled?: boolean;
}) {
    const off = busy || disabled;
    return (
        <PressScale
            onPress={onPress}
            disabled={off}
            scaleTo={0.97}
            style={[styles.actionButton, off && styles.actionDisabled]}
            accessibilityLabel={label}
        >
            <LinearGradient
                colors={[PURPLE_DARK, GRADIENT_LIGHT]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.actionGradient}
            >
                {busy
                    ? <ActivityIndicator size="small" color={WHITE} />
                    : <Text allowFontScaling={false} style={styles.actionText}>{label}</Text>}
            </LinearGradient>
        </PressScale>
    );
}

export default Profile;
