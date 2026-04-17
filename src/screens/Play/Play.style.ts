import {Dimensions, StyleSheet} from "react-native";
import {ms} from "../../utils/responsive.ts";

const {width, height} = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    countView: {
        position: 'absolute',
        right: 10,
        zIndex: 1,
    },
    boxItem: {
        position: 'absolute',
    },
    headerLeftView: {
        position: 'absolute',
        left: 10,
        zIndex: 1,
        flexDirection: 'column',
        gap: 10,
    },
    zIndexStyle: {
        zIndex: 2,
    },

    // ── Timer ──────────────────────────────────────────────────────
    timerView: {
        position: 'absolute',
        alignSelf: 'center',
        left: width / 2 - ms(36),
        zIndex: 5,
    },
    timerText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: ms(18),
        fontWeight: '800',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 4,
    },

    // ── Streak badge ───────────────────────────────────────────────
    streakBadge: {
        position: 'absolute',
        alignSelf: 'center',
        left: width / 2 - ms(42),
        zIndex: 5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: ms(14),
        paddingHorizontal: ms(12),
        paddingVertical: ms(5),
        borderWidth: 1.5,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    streakBadgeText: {
        color: '#FFD700',
        fontSize: ms(15),
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    streakCount: {
        color: 'rgba(255,215,0,0.75)',
        fontSize: ms(11),
        fontWeight: '700',
    },

    // ── Helpers row ────────────────────────────────────────────────
    helpersRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: ms(18),
        zIndex: 10,
    },
    helperButton: {
        width: ms(58),
        height: ms(58),
        borderRadius: ms(29),
        backgroundColor: 'rgba(10,10,20,0.72)',
        borderWidth: 2.5,
        borderColor: '#ff6a00',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 10,
    },
    helperButtonBomb: {
        width: ms(66),
        height: ms(66),
        borderRadius: ms(33),
        borderColor: '#ff6a00',
        shadowColor: '#ff4500',
    },
    helperButtonDisabled: {
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(10,10,20,0.3)',
        shadowOpacity: 0,
        elevation: 0,
    },
    helperBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: ms(20),
        height: ms(20),
        borderRadius: ms(10),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    helperBadgeText: {
        color: '#fff',
        fontSize: ms(11),
        fontWeight: '800',
    },
    slowCountdownText: {
        color: '#ce93d8',
        fontSize: ms(22),
        fontWeight: '900',
        letterSpacing: -0.5,
    },

    // ── Shield border ──────────────────────────────────────────────
    shieldBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        borderWidth: 6,
        borderColor: '#00e5ff',
        borderRadius: 2,
        zIndex: 19,
        shadowColor: '#00e5ff',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 0,
    },

    // ── Flash overlay ──────────────────────────────────────────────
    flashOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: '#ff6a00',
        zIndex: 20,
    },

    // ── Combo overlay ──────────────────────────────────────────────
    comboOverlay: {
        position: 'absolute',
        top: height * 0.28,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 15,
    },
    comboText: {
        fontSize: ms(36),
        fontWeight: '900',
        color: '#FFD700',
        textShadowColor: '#ff4500',
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 10,
        letterSpacing: 1.5,
    },

    // ── Level up overlay ───────────────────────────────────────────
    levelUpOverlay: {
        position: 'absolute',
        top: height * 0.38,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 16,
    },
    levelUpText: {
        fontSize: ms(42),
        fontWeight: '900',
        color: '#fff',
        textShadowColor: '#8e2de2',
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 18,
        letterSpacing: 2,
    },
    levelUpSub: {
        marginTop: ms(6),
        fontSize: ms(16),
        fontWeight: '700',
        color: '#FFD700',
        letterSpacing: 1,
        textShadowColor: '#000',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 4,
    },
});
