import {StyleSheet} from 'react-native';
import {isTablet, ms, SW, vs} from '../../../utils/responsive.ts';

// Sized and coloured against NoticeModal's 'info' palette so the two read as
// the same family of dialog — same card radius, same icon block, same purples.

export default StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(18),
    },
    // Owns the width so the card can't stretch to its longest line of text.
    cardPress: {
        width: isTablet ? Math.min(SW * 0.55, 420) : '100%',
        maxWidth: 420,
    },
    cardWrapper: {
        width: '100%',
        shadowColor: '#8e2de2',
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.5,
        shadowRadius: 28,
        elevation: 24,
    },
    card: {
        borderRadius: ms(28),
        paddingTop: vs(30),
        paddingBottom: vs(28),
        paddingHorizontal: ms(22),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.45)',
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
    },

    // ── Icon block ───────────────────────────────────────────────────────────
    iconWrap: {
        width: ms(112),
        height: ms(112),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(12),
    },
    iconHalo: {
        position: 'absolute',
        width: ms(112),
        height: ms(112),
        borderRadius: ms(56),
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.5)',
        opacity: 0.5,
    },
    iconRing: {
        width: ms(94),
        height: ms(94),
        borderRadius: ms(47),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'rgba(142,45,226,0.18)',
        borderColor: 'rgba(218,112,214,0.55)',
        shadowColor: '#8e2de2',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 14,
        // No `elevation` here, deliberately. It was meant as the Android
        // stand-in for the glow above, but elevation on a view with a
        // TRANSLUCENT background makes Android render it through a layer that
        // paints an opaque backing over the content's bounds — on device that
        // showed up as a dark chamfered rectangle sitting behind the wifi mark,
        // eating the ring's tint. The glow is an iOS-only nicety; the ring
        // already reads on Android from its border and fill.
    },
    // ── Copy ─────────────────────────────────────────────────────────────────
    title: {
        color: '#DA70D6',
        fontSize: ms(22),
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        textShadowColor: 'rgba(255,0,255,0.85)',
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
        paddingHorizontal: ms(4),
        marginBottom: vs(16),
    },

    // ── "Reconnecting automatically…" ────────────────────────────────────────
    // The last row in the card now that there are no buttons: the modal closes
    // itself when the connection returns, so this line is the whole call to
    // action.
    autoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
    },
    autoDot: {
        width: ms(7),
        height: ms(7),
        borderRadius: ms(4),
        backgroundColor: '#DA70D6',
    },
    autoText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        letterSpacing: 0.6,
    },
});
