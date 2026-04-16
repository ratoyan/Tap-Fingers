import {StyleSheet} from 'react-native';
import {DARK_PURPLE, ORCHID, PURPLE_DARK, VIOLET, WHITE} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: 24,
    },

    /* ── Avatar section ─────────────────────────────── */
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        shadowColor: DARK_PURPLE,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 12,
    },
    avatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 3,
        borderColor: ORCHID,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: PURPLE_DARK,
        borderWidth: 2,
        borderColor: WHITE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        fontSize: 16,
    },
    changePhotoText: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        marginTop: 8,
        fontWeight: '600',
        letterSpacing: 0.4,
    },

    /* ── Greeting ───────────────────────────────────── */
    greeting: {
        fontSize: 24,
        color: WHITE,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 4,
        marginBottom: 28,
        textAlign: 'center',
    },

    /* ── Input card ─────────────────────────────────── */
    inputCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        width: '100%',
        padding: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: WHITE,
        fontSize: 16,
        textAlign: 'center',
    },
});
