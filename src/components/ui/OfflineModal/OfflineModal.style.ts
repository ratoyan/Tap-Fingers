import {StyleSheet} from 'react-native';
import {WHITE} from '../../../constants/colors.ts';
import {isTablet, ms, SW, vs} from '../../../utils/responsive.ts';

// Sized against NoticeModal so the two read as the same family of dialog —
// same card radius, same icon block, same CTA height.

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
        shadowColor: '#ff4d6d',
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.5,
        shadowRadius: 28,
        elevation: 24,
    },
    card: {
        borderRadius: ms(28),
        paddingTop: vs(30),
        paddingBottom: vs(20),
        paddingHorizontal: ms(22),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,120,150,0.42)',
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
        borderColor: 'rgba(255,120,150,0.5)',
        opacity: 0.5,
    },
    iconRing: {
        width: ms(94),
        height: ms(94),
        borderRadius: ms(47),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'rgba(255,70,90,0.15)',
        borderColor: 'rgba(255,120,150,0.55)',
        shadowColor: '#ff4d6d',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 10,
    },
    // Every arc and the base share this square so they stack in register.
    iconLayer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Copy ─────────────────────────────────────────────────────────────────
    title: {
        color: '#FF8FA8',
        fontSize: ms(22),
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        textShadowColor: 'rgba(255,70,90,0.85)',
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
        marginBottom: vs(14),
    },

    // ── "Reconnecting automatically…" ────────────────────────────────────────
    autoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
        marginBottom: vs(18),
    },
    autoDot: {
        width: ms(7),
        height: ms(7),
        borderRadius: ms(4),
        backgroundColor: '#FF8FA8',
    },
    autoText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        letterSpacing: 0.6,
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    button: {
        width: '100%',
        height: vs(50),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: '#ff4d6d',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 8,
    },
    buttonGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(10),
    },
    buttonText: {
        color: WHITE,
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    spinner: {
        color: WHITE,
        fontSize: ms(18),
        fontWeight: '900',
        lineHeight: ms(20),
    },
    dismissButton: {
        marginTop: vs(12),
        paddingVertical: vs(8),
        paddingHorizontal: ms(18),
    },
    dismissText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: ms(13),
        fontWeight: '600',
        letterSpacing: 0.8,
    },
});
