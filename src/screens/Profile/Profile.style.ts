import {StyleSheet} from 'react-native';
import {DARK_PURPLE, GRADIENT_LIGHT, ORCHID, PURPLE_DARK, WHITE} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';
import {ms, scale, vs, SW} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: vs(24),
        paddingBottom: vs(40),
    },

    /* ── Avatar section ─────────────────────────────── */
    avatarSection: {
        alignItems: 'center',
        marginBottom: vs(20),
    },
    avatarWrapper: {
        shadowColor: DARK_PURPLE,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 12,
    },
    avatar: {
        width: ms(130),
        height: ms(130),
        borderRadius: ms(65),
        borderWidth: 3,
        borderColor: ORCHID,
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarEmoji: {
        fontSize: ms(64),
        textAlign: 'center',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        backgroundColor: PURPLE_DARK,
        borderWidth: 2,
        borderColor: WHITE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        fontSize: ms(16),
    },
    avatarUploading: {
        backgroundColor: PURPLE_DARK,
    },
    changePhotoText: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: ms(13),
        marginTop: vs(8),
        fontWeight: '600',
        letterSpacing: 0.4,
    },

    /* ── Greeting ───────────────────────────────────── */
    greeting: {
        fontSize: ms(24),
        color: WHITE,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 4,
        marginBottom: vs(28),
        textAlign: 'center',
    },

    /* ── Guest view ─────────────────────────────────── */
    guestSection: {
        width: SW * 0.8,
        alignSelf: 'center',
        alignItems: 'center',
        paddingTop: vs(10),
    },
    ghostAvatarWrap: {
        shadowColor: '#fff',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: vs(16),
    },
    guestName: {
        fontSize: ms(26),
        fontWeight: '800',
        color: WHITE,
        marginBottom: vs(12),
        letterSpacing: 0.5,
    },
    guestUsername: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: vs(4),
    },
    guestIdText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(11),
        textAlign: 'center',
        marginBottom: vs(12),
        letterSpacing: 0.3,
    },
    guestHint: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: ms(14),
        textAlign: 'center',
        lineHeight: ms(22),
        marginBottom: vs(24),
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: vs(14),
        gap: ms(10),
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: ms(13),
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    /* ── Guest auth buttons (open the sign-up / sign-in sheet) ── */
    authButtons: {
        width: '100%',
        alignItems: 'center',
        marginTop: vs(4),
    },
    primaryAuthButton: {
        width: '100%',
        borderRadius: ms(16),
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryAuthGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(16),
        minHeight: vs(54),
        borderRadius: ms(16),
    },
    primaryAuthText: {
        color: WHITE,
        fontSize: ms(17),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryAuthButton: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(15),
        minHeight: vs(52),
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    secondaryAuthText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    /* ── Input card ─────────────────────────────────── */
    inputCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(20),
        padding: ms(16),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(13),
        fontWeight: '700',
        marginBottom: vs(8),
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        width: '100%',
        padding: ms(14),
        borderRadius: ms(14),
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: WHITE,
        fontSize: ms(16),
        textAlign: 'center',
    },

    formFootnote: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        textAlign: 'center',
        marginTop: vs(14),
        letterSpacing: 0.3,
    },

    /* ── Confirm email card ─────────────────────────── */
    verifyCard: {
        borderColor: 'rgba(247,151,30,0.6)',
        backgroundColor: 'rgba(247,151,30,0.12)',
    },
    verifyHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(13),
        lineHeight: ms(19),
        marginBottom: vs(10),
    },
    resendText: {
        color: GRADIENT_LIGHT,
        fontSize: ms(13),
        fontWeight: '700',
        textAlign: 'center',
        marginTop: vs(12),
    },

    /* ── Account credential inputs ──────────────────── */
    accountInput: {
        width: '100%',
        paddingVertical: vs(12),
        paddingHorizontal: ms(14),
        borderRadius: ms(12),
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: WHITE,
        fontSize: ms(15),
        marginBottom: vs(10),
    },

    /* ── Delete account (danger) ────────────────────── */
    deleteButton: {
        width: '100%',
        marginTop: vs(22),
        paddingVertical: vs(15),
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: 'rgba(229,72,77,0.7)',
        backgroundColor: 'rgba(229,72,77,0.12)',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF6B6E',
        fontSize: ms(16),
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    /* ── Delete confirmation modal ──────────────────── */
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(28),
    },
    // Wraps the modal card so it lifts above the keyboard when an input is focused.
    modalAvoider: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#2A0A3D',
        borderRadius: ms(24),
        padding: ms(24),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
    },
    modalTitle: {
        color: WHITE,
        fontSize: ms(20),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: vs(12),
    },
    modalMessage: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(14),
        lineHeight: ms(21),
        textAlign: 'center',
        marginBottom: vs(18),
    },
    modalInput: {
        width: '100%',
        paddingVertical: vs(12),
        paddingHorizontal: ms(14),
        borderRadius: ms(12),
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        color: WHITE,
        fontSize: ms(15),
        marginBottom: vs(18),
    },
    modalButtons: {
        flexDirection: 'row',
        gap: ms(12),
    },
    modalBtn: {
        flex: 1,
        paddingVertical: vs(13),
        borderRadius: ms(14),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: vs(46),
    },
    modalCancel: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    modalCancelText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '700',
    },
    modalDelete: {
        backgroundColor: '#E5484D',
    },
    modalDeleteText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '800',
    },
});
