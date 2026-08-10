import {StyleSheet} from 'react-native';
import {ms, vs} from '../../../utils/responsive.ts';
import {GOLD, PLUM, PURPLE_LIGHT, WHITE} from '../../../constants/colors.ts';

export default StyleSheet.create({
    container: {
        // No `flex: 1` here: the FlatList's empty content container centers this
        // (flexGrow + justifyContent). Letting it size to its own content means
        // that when the column is taller than the viewport it grows the scroll
        // area instead of clipping the CTA button off the bottom.
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: vs(40),
        paddingBottom: vs(40),
        paddingHorizontal: ms(20),
    },
    illustrationWrap: {
        width: ms(180),
        height: ms(180),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(28),
    },
    halo: {
        position: 'absolute',
        width: ms(180),
        height: ms(180),
        borderRadius: ms(90),
        overflow: 'hidden',
    },
    haloGradient: {
        width: '100%',
        height: '100%',
        borderRadius: ms(90),
    },
    iconCard: {
        width: ms(112),
        height: ms(112),
        borderRadius: ms(32),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(26,26,46,0.55)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 12,
    },
    iconCardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sparkleTopLeft: {
        position: 'absolute',
        top: ms(8),
        left: ms(18),
        fontSize: ms(16),
        color: GOLD,
        textShadowColor: GOLD,
        textShadowRadius: 8,
    },
    sparkleTopRight: {
        position: 'absolute',
        top: ms(20),
        right: ms(10),
        fontSize: ms(12),
        color: PLUM,
        textShadowColor: PLUM,
        textShadowRadius: 6,
    },
    sparkleBottomLeft: {
        position: 'absolute',
        bottom: ms(22),
        left: ms(8),
        fontSize: ms(13),
        color: PLUM,
        textShadowColor: PLUM,
        textShadowRadius: 6,
    },
    title: {
        color: WHITE,
        fontSize: ms(20),
        fontWeight: '800',
        letterSpacing: 0.3,
        textAlign: 'center',
        marginBottom: vs(8),
    },
    subtitle: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: ms(14),
        lineHeight: ms(20),
        textAlign: 'center',
        fontWeight: '500',
        maxWidth: ms(280),
        marginBottom: vs(28),
    },
    ctaWrap: {
        borderRadius: ms(28),
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.55,
        shadowRadius: 18,
        elevation: 12,
        marginBottom: vs(22),
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: vs(54),
        paddingLeft: ms(14),
        paddingRight: ms(26),
        // Pill shape (radius ≈ height / 2) reads as a friendlier game CTA.
        borderRadius: ms(28),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        gap: ms(11),
        minWidth: ms(210),
        // Clip the absolute-fill gradient below to the pill's rounded corners.
        overflow: 'hidden',
    },
    ctaGradientFill: {
        ...StyleSheet.absoluteFillObject,
    },
    // Translucent white disc holding the play glyph — gives the button a focal
    // point and balances the label so it no longer looks like a bare bar.
    ctaIcon: {
        width: ms(30),
        height: ms(30),
        borderRadius: ms(15),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.20)',
    },
    ctaIconText: {
        color: WHITE,
        fontSize: ms(12),
        fontWeight: '700',
        marginLeft: ms(1), // optical centring of the triangle
    },
    ctaText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
        paddingHorizontal: ms(14),
        paddingVertical: vs(8),
        borderRadius: ms(14),
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    tipDot: {
        width: ms(6),
        height: ms(6),
        borderRadius: ms(3),
        backgroundColor: GOLD,
        shadowColor: GOLD,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    tipText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: ms(12),
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
