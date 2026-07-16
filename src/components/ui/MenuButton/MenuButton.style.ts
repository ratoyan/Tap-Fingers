import {StyleSheet} from 'react-native';
import {BLACK, WHITE} from '../../../constants/colors.ts';
import {ms, scale, vs, isTablet, SW, SH} from '../../../utils/responsive.ts';

// Render size of the button's SVG art. Kept here (not inline in the component)
// so it scales off the same responsive helpers as the label beside it.
export const MENU_ICON_SIZE = ms(isTablet ? 32 : 30);

export default StyleSheet.create({
    buttonContainer: {
        marginVertical: vs(isTablet ? 10 : 14),
        borderRadius: ms(20),
        shadowColor: BLACK,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        width: isTablet ? Math.min(SW * 0.6, 480) : SW * 0.8,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(isTablet ? 18 : 20),
        paddingHorizontal: scale(24),
        borderRadius: ms(20),
    },
    icon: {
        marginRight: scale(12),
    },
    title: {
        fontSize: ms(isTablet ? 20 : 18),
        fontWeight: '700',
        color: WHITE,
    },
});
