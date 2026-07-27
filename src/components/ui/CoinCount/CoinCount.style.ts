import {StyleSheet} from 'react-native';
import {ms, scale, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingRight: scale(10),
        paddingLeft: scale(5),
        paddingVertical: vs(6),
        borderRadius: ms(15),
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: 'gold',
        fontWeight: 'bold',
        fontSize: ms(15),
        marginLeft: scale(10),
    },
    // Exactly the coin's own box, so adding the badge doesn't change the pill's
    // height or push the count across — the badge hangs 3dp past the corner into
    // the container's existing padding.
    coinWrap: {
        width: 22,
        height: 20,
    },
    addBadge: {
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: ms(13),
        height: ms(13),
        borderRadius: ms(7),
        // The badge lands on the coin's own orange, so it needs a cut line to
        // read as a separate object rather than part of the artwork. A dark ring
        // does that without introducing a colour the pill doesn't already use.
        borderWidth: 1.5,
        borderColor: '#1A0B2E',
        overflow: 'hidden',
    },
    addFill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addSign: {
        // Dark on gold rather than white: the pill sits over gameplay art, and a
        // white "+" on this gradient loses its edge against a light background.
        color: '#4A2E00',
        fontSize: ms(10),
        fontWeight: '900',
        lineHeight: ms(11),
        // Android pads glyphs vertically by default, which pushes a "+" off the
        // centre of a circle this small.
        includeFontPadding: false,
        textAlign: 'center',
    },
});
