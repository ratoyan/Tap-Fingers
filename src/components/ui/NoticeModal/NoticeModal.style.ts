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
    cardWrapper: {
        width: isTablet ? Math.min(SW * 0.55, 420) : '100%',
        maxWidth: 420,
    },
    card: {
        borderRadius: ms(26),
        paddingTop: vs(30),
        paddingBottom: vs(22),
        paddingHorizontal: ms(22),
        alignItems: 'center',
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    shine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 90,
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{skewX: '-20deg'}],
    },
    iconRing: {
        width: ms(82),
        height: ms(82),
        borderRadius: ms(41),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: vs(14),
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
        width: '45%',
        height: 1,
        marginVertical: vs(12),
        opacity: 0.45,
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
        overflow: 'hidden',
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
