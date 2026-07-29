import {StyleSheet} from 'react-native';
import {
    DARK_PURPLE,
    GRADIENT_LIGHT,
    MEDIUM_PURPLE,
    ORCHID,
    PURPLE,
    PURPLE_DARK, PURPLE_ONE,
    VIOLET,
    WHITE
} from '../../constants/colors.ts';
import {ms, vs, isTablet} from '../../utils/responsive.ts';

// Cap the content column so it doesn't stretch edge-to-edge on big screens.
const CONTENT_MAX = isTablet ? 520 : 460;

// Breathing room added below the form while the keyboard is open, on top of the
// keyboard height itself — so the last field and the buttons can be scrolled
// comfortably clear of it instead of sitting right on its top edge.
export const KEYBOARD_EXTRA_PADDING = vs(110);

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: ms(22),
        paddingVertical: vs(28),
    },
    content: {
        width: '100%',
        maxWidth: CONTENT_MAX,
        alignSelf: 'center',
        alignItems: 'center',
    },

    /* ── Header ───────────────────────────────────────── */
    title: {
        fontSize: ms(36),
        fontWeight: '900',
        color: WHITE,
        letterSpacing: 1,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: {width: 0, height: 3},
        textShadowRadius: 10,
    },
    subtitle: {
        marginTop: vs(6),
        fontSize: ms(14),
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
        textAlign: 'center',
    },

    /* ── Logo + ghost ─────────────────────────────────── */
    logoRow: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginVertical: vs(4),
    },
    ghostWrap: {
        position: 'absolute',
        right: -ms(24),
        bottom: ms(10),
    },

    /* ── Form card ────────────────────────────────────── */
    card: {
        width: '100%',
        backgroundColor: PURPLE_ONE,
        borderRadius: ms(26),
        paddingVertical: vs(22),
        paddingHorizontal: ms(18),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 8,
    },
    cardTitle: {
        color: WHITE,
        fontSize: ms(18),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: vs(16),
        letterSpacing: 0.3,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(16),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: ms(14),
        marginBottom: vs(12),
    },
    fieldRowFocused: {
        borderColor: VIOLET,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    fieldIcon: {
        marginRight: ms(10),
    },
    fieldInput: {
        flex: 1,
        color: WHITE,
        fontSize: ms(16),
        paddingVertical: vs(13),
    },
    primaryButton: {
        width: '100%',
        marginTop: vs(6),
        borderRadius: ms(18),
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(16),
        borderRadius: ms(18),
        minHeight: vs(54),
    },
    primaryText: {
        fontSize: ms(17),
        fontWeight: '800',
        color: WHITE,
        letterSpacing: 0.5,
    },
    toggleText: {
        marginTop: vs(16),
        fontSize: ms(14),
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    toggleTextAccent: {
        color: WHITE,
        fontWeight: 'bold',
    },

    /* ── Divider ──────────────────────────────────────── */
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: vs(18),
        gap: ms(12),
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(13),
        fontWeight: '700',
        letterSpacing: 1.5,
    },

    /* ── Guest button ─────────────────────────────────── */
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: vs(15),
        borderRadius: ms(18),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        gap: ms(10),
    },
    guestButtonText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: ms(16),
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* ── Sound toggle ─────────────────────────────────── */
    soundButton: {
        position: 'absolute',
        right: ms(16),
        width: ms(44),
        height: ms(44),
        borderRadius: ms(22),
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});
