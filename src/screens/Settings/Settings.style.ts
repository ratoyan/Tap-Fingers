import {StyleSheet} from 'react-native';
import {
    DARK_PURPLE,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    MEDIUM_PURPLE,
    ORCHID,
    PLUM,
    PURPLE,
    PURPLE_DARK,
    WHITE
} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';
import {ms, vs} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },

    // Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(10),
        marginTop: vs(20),
        marginBottom: vs(8),
    },
    sectionTitle: {
        color: PLUM,
        fontSize: ms(10),
        fontWeight: '800',
        letterSpacing: 2.5,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        borderRadius: 2,
        opacity: 0.5,
    },

    // Card
    card: {
        backgroundColor: PURPLE,
        borderRadius: ms(18),
        paddingHorizontal: ms(16),
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.2)',
        shadowColor: PURPLE,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
    },

    // Exit button — small pill, centered
    buttonWrapper: {
        alignSelf: 'center',
        marginTop: vs(30),
        borderRadius: ms(50),
        shadowColor: DARK_PURPLE,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.35)',
        overflow: 'hidden',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
        paddingVertical: vs(10),
        paddingHorizontal: ms(26),
    },
    buttonText: {
        color: PLUM,
        fontWeight: '700',
        fontSize: ms(13),
        letterSpacing: 1.8,
        textTransform: 'uppercase',
    },

    // Unused legacy styles kept for compatibility
    profileContainer: {
        alignItems: 'center',
        marginBottom: vs(40),
    },
    avatarWrapper: {
        position: 'relative',
        marginTop: vs(30),
    },
    avatar: {
        width: ms(110),
        height: ms(110),
        borderRadius: ms(55),
        borderWidth: 4,
        borderColor: WHITE,
    },
    avatarRing: {
        position: 'absolute',
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        borderRadius: 61,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    username: {
        fontSize: ms(20),
        fontWeight: 'bold',
        color: WHITE,
    },
    greeting: {
        marginTop: vs(12),
        fontSize: ms(20),
        fontWeight: '600',
        color: WHITE,
    },
});
