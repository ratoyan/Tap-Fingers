import {StyleSheet} from 'react-native';
import {BLUISH_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, ORCHID, PLUM, PURPLE, PURPLE_LIGHT, WHITE, WHITE_100} from '../../../constants/colors.ts';
import {ms, vs, isTablet, SW} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: isTablet ? Math.min(SW * 0.5, 400) : '82%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(24),
        paddingVertical: vs(26),
        paddingHorizontal: ms(22),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.35)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 18,
    },
    title: {
        fontSize: ms(22),
        fontWeight: '800',
        marginBottom: vs(10),
        color: ORCHID,
        letterSpacing: 0.8,
        textShadowColor: PURPLE_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 8,
    },
    message: {
        fontSize: ms(15),
        textAlign: 'center',
        marginBottom: vs(24),
        color: WHITE_100,
        opacity: 0.85,
        lineHeight: ms(22),
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: ms(10),
    },
    button: {
        flex: 1,
        paddingVertical: vs(13),
        borderRadius: ms(14),
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1.5,
        borderColor: PURPLE,
        backgroundColor: 'transparent',
    },
    confirmButton: {
        backgroundColor: GRADIENT_LIGHT,
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        fontSize: ms(15),
        fontWeight: '700',
    },
    cancelText: {
        color: PLUM,
    },
    confirmText: {
        color: WHITE,
    },
});
