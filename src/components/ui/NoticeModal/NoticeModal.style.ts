import {StyleSheet} from 'react-native';
import {WHITE} from '../../../constants/colors.ts';
import {ms, vs, isTablet, SW} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.78)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(18),
    },
    // Direct child of the centered backdrop — it owns the width so the card
    // can't stretch to fit a long message line. (Percent widths need a sized
    // parent; the wrapping Pressable previously had none, so the card grew to
    // its content width.)
    cardPress: {
        width: isTablet ? Math.min(SW * 0.55, 420) : '100%',
        maxWidth: 420,
    },
    cardWrapper: {
        width: '100%',
        // Coloured glow around the card (tint set per-palette inline).
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.55,
        shadowRadius: 28,
        elevation: 24,
    },
    card: {
        borderRadius: ms(28),
        paddingTop: vs(32),
        paddingBottom: vs(22),
        paddingHorizontal: ms(22),
        alignItems: 'center',
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    sheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: ms(130),
    },
    shine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 90,
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{skewX: '-20deg'}],
    },
    closeBtn: {
        position: 'absolute',
        top: ms(12),
        right: ms(12),
        width: ms(30),
        height: ms(30),
        borderRadius: ms(15),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        zIndex: 2,
    },
    closeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(15),
        fontWeight: '700',
        lineHeight: ms(18),
    },
    iconWrap: {
        width: ms(100),
        height: ms(100),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(14),
    },
    iconHalo: {
        position: 'absolute',
        width: ms(100),
        height: ms(100),
        borderRadius: ms(50),
        borderWidth: 1.5,
        opacity: 0.5,
    },
    iconRing: {
        width: ms(82),
        height: ms(82),
        borderRadius: ms(41),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        // Soft glow behind the icon (tint set per-palette inline).
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 10,
    },
    iconEmoji: {
        fontSize: ms(42),
    },
    title: {
        fontSize: ms(22),
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: vs(4),
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 12,
    },
    divider: {
        width: '60%',
        height: 1.5,
        borderRadius: 1,
        marginVertical: vs(12),
    },
    message: {
        fontSize: ms(15),
        lineHeight: ms(22),
        textAlign: 'center',
        color: 'rgba(255,255,255,0.82)',
        marginBottom: vs(22),
        paddingHorizontal: ms(4),
    },
    button: {
        width: '100%',
        borderRadius: ms(16),
        // Coloured glow under the CTA (tint set per-palette inline).
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 8,
    },
    buttonGradient: {
        paddingVertical: vs(14),
        alignItems: 'center',
        borderRadius: ms(16),
    },
    buttonText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});
