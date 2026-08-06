import {StyleSheet} from 'react-native';
import {GRADIENT_LIGHT, VIOLET, WHITE} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';
import {ms, vs} from '../../utils/responsive.ts';

// Vertical rhythm between the stacked blocks (hero → stats → cards → danger).
const BLOCK_GAP = vs(14);

export default StyleSheet.create({
    // Full-bleed gradient background — no padding here, or on iOS (new arch)
    // it sizes to its padded content and leaves white side gutters.
    container: {
        flex: 1,
    },
    // Side padding lives on an inner view so the gradient still fills the width.
    content: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    flex: {
        flex: 1,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: vs(16),
        paddingBottom: vs(40),
    },
    /* Every block in the scroll is full width; the wrappers are Entrance views,
       which hug their content unless told to stretch. */
    block: {
        width: '100%',
        marginTop: BLOCK_GAP,
    },
    blockFirst: {
        width: '100%',
    },
    // The danger zone stands apart from the settings above it.
    blockWide: {
        width: '100%',
        marginTop: vs(26),
    },

    /* ── Stat tiles row ─────────────────────────────── */
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        gap: ms(10),
    },

    /* ── Inputs ─────────────────────────────────────── */
    // Focus is drawn on the field itself rather than with a glow: these sit
    // inside translucent cards where a shadow would just muddy the panel.
    input: {
        width: '100%',
        paddingVertical: vs(13),
        paddingHorizontal: ms(14),
        borderRadius: ms(14),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.13)',
        color: WHITE,
        fontSize: ms(16),
        textAlign: 'center',
    },
    accountInput: {
        width: '100%',
        paddingVertical: vs(12),
        paddingHorizontal: ms(14),
        borderRadius: ms(13),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.13)',
        color: WHITE,
        fontSize: ms(15),
        marginBottom: vs(10),
    },
    inputFocused: {
        borderColor: VIOLET,
        backgroundColor: 'rgba(255,255,255,0.19)',
    },
    // The 6-digit confirmation code: wide tracking so the digits read as slots.
    codeInput: {
        textAlign: 'center',
        letterSpacing: ms(10),
        fontSize: ms(22),
        fontWeight: '800',
        paddingVertical: vs(14),
    },

    /* ── Card action button (Save / Update / Confirm) ── */
    // Only the single-field cards need this: everywhere else the field above the
    // button already carries its own bottom margin.
    actionSpacer: {
        height: vs(10),
    },
    // Layout lives on the touchable itself; the gradient is an absolute-fill
    // background (a LinearGradient sized by its content collapses on iOS Fabric).
    actionButton: {
        width: '100%',
        marginTop: vs(2),
        height: vs(46),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ms(14),
        overflow: 'hidden',
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 6,
    },
    actionGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    actionText: {
        color: WHITE,
        fontSize: ms(14.5),
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    actionDisabled: {
        opacity: 0.42,
    },

    /* ── Confirm email card ─────────────────────────── */
    verifyHint: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: ms(13),
        lineHeight: ms(19),
        marginBottom: vs(12),
    },
    resendText: {
        color: '#FFD8A8',
        fontSize: ms(13),
        fontWeight: '700',
        textAlign: 'center',
        marginTop: vs(14),
    },

    /* ── Guest view ─────────────────────────────────── */
    guestIdChip: {
        marginTop: vs(10),
        paddingHorizontal: ms(12),
        paddingVertical: vs(5),
        borderRadius: ms(999),
        backgroundColor: 'rgba(0,0,0,0.28)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    guestIdText: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: ms(11),
        letterSpacing: 0.4,
        fontWeight: '600',
    },
    guestHint: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: ms(14),
        textAlign: 'center',
        lineHeight: ms(21),
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: vs(12),
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
    authButtons: {
        width: '100%',
        alignItems: 'center',
    },
    primaryAuthButton: {
        width: '100%',
        marginTop: vs(10),
        height: vs(54),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(18),
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryAuthGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    primaryAuthText: {
        color: WHITE,
        fontSize: ms(17),
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    secondaryAuthButton: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(15),
        paddingHorizontal: ms(18),
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
        textAlign: 'center',
    },
    formFootnote: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        textAlign: 'center',
        marginTop: vs(14),
        letterSpacing: 0.3,
    },

    /* ── Delete account (danger) ────────────────────── */
    deleteButtonWrapper: {
        alignSelf: 'stretch',
        shadowColor: '#E5484D',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.32,
        shadowRadius: 14,
        elevation: 6,
    },
    deleteButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(13),
        paddingHorizontal: ms(16),
        minHeight: vs(58),
        borderRadius: ms(18),
        borderWidth: 1,
        borderColor: 'rgba(255,107,110,0.45)',
        overflow: 'hidden',
    },
    deleteGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    deleteIconBadge: {
        width: ms(34),
        height: ms(34),
        borderRadius: ms(17),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(229,72,77,0.22)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,110,0.40)',
    },
    deleteIcon: {
        fontSize: ms(16),
    },
    deleteButtonText: {
        flex: 1,
        marginLeft: ms(12),
        color: '#FF8A8D',
        fontSize: ms(15.5),
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    deleteChevron: {
        color: 'rgba(255,138,141,0.65)',
        fontSize: ms(24),
        fontWeight: '700',
        marginLeft: ms(8),
        marginTop: -vs(2),
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
