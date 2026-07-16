import React, {useEffect, useRef, useState} from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    Platform,
    ActivityIndicator,
    Animated,
    PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import * as authService from '../../../services/authService.ts';
import {notice} from '../../../utils/notice.ts';
import {isTablet, SH} from '../../../utils/responsive.ts';

import PersonIcon from '../../../assets/icons/PersonIcon.tsx';
import MailIcon from '../../../assets/icons/MailIcon.tsx';
import LockIcon from '../../../assets/icons/LockIcon.tsx';
import EyeIcon from '../../../assets/icons/EyeIcon.tsx';

import styles from './GuestAuthModal.style.ts';
import {GRADIENT_LIGHT, PURPLE_DARK, VIOLET} from '../../../constants/colors.ts';

export type GuestAuthMode = 'register' | 'login';

// A downward drag must travel this far (or be flicked this fast) to dismiss;
// anything less springs the sheet back to its open position.
const DISMISS_FRACTION = 0.25;
const DISMISS_VELOCITY = 1.2;
// How far a touch must move down before it counts as a drag rather than a tap.
const DRAG_START_SLOP = 8;

interface GuestAuthModalProps {
    visible: boolean;
    /** Which form to open on — the caller picks it via the two guest buttons. */
    mode: GuestAuthMode;
    onClose: () => void;
    /** Guest upgraded in place; the email still needs confirming. */
    onRegistered: (email: string) => void;
    /** Signed into a different, already-existing account. */
    onLoggedIn: () => void;
}

/**
 * Sign-up / sign-in form for a guest, presented as a bottom sheet so the
 * Profile screen itself stays a short summary instead of a long form.
 *
 * Owns its own field state and auth calls; the caller only reacts to the
 * outcome (refresh the session, navigate) via the two callbacks.
 */
export default function GuestAuthModal({
    visible,
    mode,
    onClose,
    onRegistered,
    onLoggedIn,
}: GuestAuthModalProps) {
    const {t} = useTranslation();

    const [authMode, setAuthMode] = useState<GuestAuthMode>(mode);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

    // Starts a full screen down so the sheet is never briefly visible at its
    // resting spot before the open animation takes over.
    const slideAnim = useRef(new Animated.Value(SH)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    // Read from inside the pan handlers, which are created once and would
    // otherwise close over the first render's values.
    const sheetHeightRef = useRef(SH);
    const busyRef = useRef(busy);
    busyRef.current = busy;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    function springOpen() {
        Animated.spring(slideAnim, {
            toValue: 0,
            friction: 9,
            tension: 70,
            useNativeDriver: true,
        }).start();
    }

    // Lives on the grab area at the top of the sheet rather than the whole
    // sheet: the form scrolls, and a pan responder spanning the ScrollView
    // would have to fight it for every gesture.
    const panResponder = useRef(
        PanResponder.create({
            // Claim taps too, so a tap on the grab area is swallowed here
            // instead of falling through to the backdrop and closing the sheet.
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) =>
                !busyRef.current && gesture.dy > DRAG_START_SLOP,
            onPanResponderGrant: () => Keyboard.dismiss(),
            onPanResponderMove: (_, gesture) => {
                // Downward only — the sheet does not stretch above its open spot.
                if (gesture.dy > 0) slideAnim.setValue(gesture.dy);
            },
            onPanResponderRelease: (_, gesture) => {
                const dismiss =
                    gesture.dy > sheetHeightRef.current * DISMISS_FRACTION ||
                    gesture.vy > DISMISS_VELOCITY;
                if (!dismiss) {
                    springOpen();
                    return;
                }
                // Finish the swipe under the finger's momentum, then let the
                // parent flip `visible` and unmount us.
                Animated.timing(slideAnim, {
                    toValue: sheetHeightRef.current,
                    duration: 180,
                    useNativeDriver: true,
                }).start(() => onCloseRef.current());
            },
            onPanResponderTerminationRequest: () => false,
        }),
    ).current;

    // Each opening starts from the mode the caller asked for, with the fields
    // cleared so a previous attempt's input never leaks into the next one.
    useEffect(() => {
        if (!visible) return;
        setAuthMode(mode);
        setName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setFocusedField(null);
    }, [visible, mode]);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: visible ? 0 : sheetHeightRef.current,
                friction: 9,
                tension: 70,
                useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
                toValue: visible ? 1 : 0,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, slideAnim, backdropAnim]);

    const fieldIconSize = isTablet ? 24 : 21;
    const iconColor = (field: 'name' | 'email' | 'password') =>
        focusedField === field ? VIOLET : 'rgba(255,255,255,0.55)';

    function handleClose() {
        if (busy) return;
        Keyboard.dismiss();
        onClose();
    }

    function toggleAuthMode() {
        if (busy) return;
        setFocusedField(null);
        setAuthMode(prev => (prev === 'register' ? 'login' : 'register'));
    }

    // Mirrors the backend validators (tapfingers-server auth.validator):
    // username 3-32 alphanumeric/underscore, valid email, password 6-72.
    function validateRegistration(): string | null {
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(name.trim())) {
            return t('nameRuleError');
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            return t('validEmailError');
        }
        if (password.length < 6) {
            return t('passwordMinError');
        }
        return null;
    }

    async function handleEmailSignUp() {
        if (busy) return;
        const validationError = validateRegistration();
        if (validationError) {
            notice.error(t('checkDetails'), validationError);
            return;
        }
        setBusy(true);
        try {
            // Upgrades the current guest account to an email/password account,
            // keeping all of the guest's progress server-side.
            await authService.linkEmail(name.trim(), email.trim(), password);
            Keyboard.dismiss();
            onRegistered(email.trim());
        } catch (error: any) {
            notice.error(t('signUpFailed'), error?.message ?? t('tryAgain'));
        } finally {
            setBusy(false);
        }
    }

    // Signs the guest into a DIFFERENT, already-existing account. Unlike the
    // sign-up above (which upgrades this guest in place), this swaps to another
    // account's session, so the guest's local progress is left behind on the
    // server under its own guest_id.
    async function handleEmailLogin() {
        if (busy) return;
        const trimmedEmail = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            notice.error(t('checkDetails'), t('validEmailError'));
            return;
        }
        if (password.length < 6) {
            notice.error(t('checkDetails'), t('passwordMinError'));
            return;
        }
        setBusy(true);
        try {
            await authService.emailLogin(trimmedEmail, password);
            Keyboard.dismiss();
            onLoggedIn();
        } catch (error: any) {
            notice.error(t('signInFailed'), error?.message ?? t('tryAgain'));
        } finally {
            setBusy(false);
        }
    }

    const submit = authMode === 'register' ? handleEmailSignUp : handleEmailLogin;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
            <TouchableWithoutFeedback
                onPress={handleClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
            >
                <Animated.View style={[styles.backdrop, {opacity: backdropAnim}]} />
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
                style={styles.avoider}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                pointerEvents="box-none"
            >
                {/* The sheet swallows its own touches — without a responder of
                    its own, a tap on the padding between fields would fall
                    through to the backdrop behind it and close the form. */}
                <Animated.View
                    style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}
                    onStartShouldSetResponder={() => true}
                    onLayout={e => { sheetHeightRef.current = e.nativeEvent.layout.height; }}
                >
                    {/* Grab area — drag anywhere on the handle or the title. */}
                    <View style={styles.dragZone} {...panResponder.panHandlers}>
                        <View style={styles.handleBar} />
                        <Text allowFontScaling={false} style={styles.title}>
                            {authMode === 'register'
                                ? `✨ ${t('createYourAccount')}`
                                : `👋 ${t('signInToAccount')}`}
                        </Text>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.sheetContent}
                    >
                        {authMode === 'register' && (
                            <View style={[styles.fieldRow, focusedField === 'name' && styles.fieldRowFocused]}>
                                <PersonIcon size={fieldIconSize} color={iconColor('name')} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    placeholder={t('name')}
                                    placeholderTextColor="rgba(255,255,255,0.45)"
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setFocusedField('name')}
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
                                onFocus={() => setFocusedField('email')}
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
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!busy}
                                allowFontScaling={false}
                                returnKeyType="done"
                                onSubmitEditing={submit}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(v => !v)}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <EyeIcon size={fieldIconSize} off={!showPassword} color={iconColor('password')} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={submit}
                            disabled={busy}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[PURPLE_DARK, GRADIENT_LIGHT]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.submitGradient}
                            >
                                {busy
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text allowFontScaling={false} style={styles.submitText}>
                                        {authMode === 'register' ? t('createAccount') : t('signIn')}
                                    </Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Switch between "create account" and "sign in to another account" */}
                        <TouchableOpacity
                            onPress={toggleAuthMode}
                            disabled={busy}
                            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        >
                            <Text allowFontScaling={false} style={styles.toggleText}>
                                {authMode === 'register' ? t('haveAccount') : t('noAccount')}
                                <Text style={styles.toggleAccent}>
                                    {authMode === 'register' ? t('signInAction') : t('signUp')}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        {authMode === 'register' && (
                            <Text allowFontScaling={false} style={styles.footnote}>
                                🔒 {t('progressSafeNote')}
                            </Text>
                        )}
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
