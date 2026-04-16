import {StyleSheet} from 'react-native';
import {DARK_PURPLE, ORCHID, PURPLE_DARK, VIOLET, WHITE} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';
import {ms, scale, vs} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: vs(24),
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
        marginBottom: vs(4),
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
        marginTop: vs(4),
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
});
