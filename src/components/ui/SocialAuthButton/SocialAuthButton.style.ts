import {StyleSheet} from 'react-native';
import {WHITE} from '../../../constants/colors.ts';
import {ms, vs, isTablet, SW} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    button: {
        width: isTablet ? Math.min(SW * 0.55, 440) : '90%',
        marginVertical: vs(10),
        borderRadius: ms(35),
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(16),
        paddingHorizontal: ms(25),
        borderRadius: ms(35),
        gap: ms(10),
    },
    buttonTextLarge: {
        fontSize: ms(18),
        fontWeight: 'bold',
        color: WHITE,
    },
    ghostBorder: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    ghostText: {
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
    },
});
