import {StyleSheet} from 'react-native';
import {BLACK, WHITE} from '../../../constants/colors.ts';
import {ms, scale, vs, isTablet, SW} from '../../../utils/responsive.ts';

// Render size of the button's SVG art. Kept here (not inline in the component)
// so it scales off the same responsive helpers as the label beside it.
export const MENU_ICON_SIZE = ms(isTablet ? 32 : 30);

// Exported so the entrance gloss can travel exactly edge to edge without an
// onLayout round-trip — the button's width is a constant, not a measurement.
export const MENU_BUTTON_WIDTH = isTablet ? Math.min(SW * 0.6, 480) : SW * 0.8;

export default StyleSheet.create({
    buttonContainer: {
        marginVertical: vs(isTablet ? 10 : 14),
        borderRadius: ms(20),
        shadowColor: BLACK,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        width: MENU_BUTTON_WIDTH,
        overflow: 'hidden',
    },
    // Clipped by buttonContainer's overflow:hidden, so the gloss follows the
    // rounded corners for free. Taller than the button and pulled up, so the
    // skew doesn't cut a triangle out of the top and bottom edges.
    sweep: {
        position: 'absolute',
        left: 0,
        top: '-50%',
        height: '200%',
        width: MENU_BUTTON_WIDTH * 0.42,
    },
    sweepFill: {
        flex: 1,
    },
    gradientButton: {
        // The label is the only in-flow child so it centres across the button's
        // full width; the icon is pulled out of flow (absolute, below) so it
        // sits on the left without shifting the text off-centre.
        alignItems: 'center',
        justifyContent: 'center',
        height: vs(isTablet ? 60 : 62),
        paddingHorizontal: scale(24),
        borderRadius: ms(20),
    },
    icon: {
        position: 'absolute',
        left: scale(24),
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    title: {
        fontSize: ms(isTablet ? 20 : 18),
        fontWeight: '700',
        color: WHITE,
        textAlign: 'center',
    },
});
