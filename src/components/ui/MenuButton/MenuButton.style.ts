import {Platform, StyleSheet} from 'react-native';
import {BLACK, WHITE} from '../../../constants/colors.ts';
import {ms, scale, vs, isTablet, SW} from '../../../utils/responsive.ts';

// On the big iPhone screens the shared responsive sizing read smaller than the
// Android build, so phone-iOS gets a bump to match that fuller look.
const iosPhone = Platform.OS === 'ios' && !isTablet;

// Render size of the button's SVG art. Kept here (not inline in the component)
// so it scales off the same responsive helpers as the label beside it.
export const MENU_ICON_SIZE = ms(isTablet ? 32 : iosPhone ? 34 : 30);

// Exported so the entrance gloss can travel exactly edge to edge without an
// onLayout round-trip — the button's width is a constant, not a measurement.
export const MENU_BUTTON_WIDTH = isTablet ? Math.min(SW * 0.6, 480) : SW * (iosPhone ? 0.78 : 0.8);

export default StyleSheet.create({
    buttonContainer: {
        marginVertical: vs(isTablet ? 10 : iosPhone ? 15 : 14),
        borderRadius: ms(20),
        shadowColor: BLACK,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        width: MENU_BUTTON_WIDTH,
        overflow: 'hidden',
        // Row layout lives here (not on the gradient) so icon + label centre
        // correctly on iOS Fabric.
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(12),
        height: vs(isTablet ? 60 : iosPhone ? 72 : 62),
        paddingHorizontal: scale(24),
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
        ...StyleSheet.absoluteFillObject,
    },
    icon: {
        justifyContent: 'center',
    },
    title: {
        fontSize: ms(isTablet ? 20 : iosPhone ? 21 : 18),
        fontWeight: '700',
        color: WHITE,
        textAlign: 'center',
    },
});
