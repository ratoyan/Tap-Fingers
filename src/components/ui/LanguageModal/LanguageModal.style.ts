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
    card: {
        width: isTablet ? Math.min(SW * 0.55, 420) : '82%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(24),
        paddingVertical: vs(22),
        paddingHorizontal: ms(20),
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
        color: ORCHID,
        fontSize: ms(20),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: vs(16),
        letterSpacing: 1,
        textShadowColor: PURPLE_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 8,
    },
    item: {
        width: '100%',
        paddingVertical: vs(13),
        paddingHorizontal: ms(14),
        borderRadius: ms(12),
        marginBottom: vs(6),
        borderWidth: 1,
        borderColor: 'rgba(218,112,214,0.2)',
    },
    text: {
        color: WHITE_100,
        fontSize: ms(16),
        textAlign: 'center',
        fontWeight: '500',
    },
    selectedItem: {
        backgroundColor: 'rgba(142,45,226,0.35)',
        borderColor: GRADIENT_LIGHT,
    },
    selectedText: {
        fontWeight: '800',
        color: WHITE,
    },
});
