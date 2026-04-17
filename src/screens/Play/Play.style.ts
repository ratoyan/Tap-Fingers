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

    // ── Bomb button ────────────────────────────────────────────────
    bombWrapper: {
        position: 'absolute',
        alignSelf: 'center',
        left: width / 2 - ms(32),
        zIndex: 10,
    },
    bombButton: {
        width: ms(64),
        height: ms(64),
        borderRadius: ms(32),
        backgroundColor: 'rgba(20,10,0,0.72)',
        borderWidth: 2.5,
        borderColor: '#ff6a00',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ff4500',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.95,
        shadowRadius: 14,
        elevation: 12,
    },
    bombButtonDisabled: {
        borderColor: 'rgba(255,106,0,0.2)',
        backgroundColor: 'rgba(20,10,0,0.3)',
        shadowOpacity: 0,
        elevation: 0,
    },
    bombBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: ms(20),
        height: ms(20),
        borderRadius: ms(10),
        backgroundColor: '#ff4500',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    bombBadgeText: {
        color: '#fff',
        fontSize: ms(11),
        fontWeight: '800',
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
        alignSelf: 'center',
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
});
