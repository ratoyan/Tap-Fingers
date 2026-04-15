import {StyleSheet} from "react-native";
import {DARK_PURPLE, GOLD, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE_DARK, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    cardWrapper: {
        width: '48%',
        marginBottom: 18,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    // selected glowing border
    selectedBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 22,
        borderWidth: 2.5,
        zIndex: 0,
    },
    // top preview area
    preview: {
        width: '100%',
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    // bottom info area
    info: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: WHITE,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    // price badge
    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    priceText: {
        fontWeight: '800',
        fontSize: 14,
        color: GOLD,
    },
    // owned badge
    ownedBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    ownedText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        fontSize: 13,
    },
    // equipped badge
    equippedBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(50,205,50,0.2)',
    },
    equippedText: {
        color: '#7fff7f',
        fontWeight: '800',
        fontSize: 13,
    },
    // lock overlay
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    lockText: {
        fontSize: 30,
        marginBottom: 4,
    },
    lockPrice: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    // square preview grid
    squareGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 80,
        gap: 5,
    },
    squareItem: {
        width: 34,
        height: 34,
        borderRadius: 6,
    },
});
