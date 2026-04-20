import {StyleSheet} from 'react-native';
import {GOLD, LIGHT_GREEN} from '../../../constants/colors.ts';
import {ms, vs, isTablet} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    cardWrapper: {
        width: '48%',
        marginBottom: ms(18),
    },
    card: {
        borderRadius: ms(20),
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    selectedBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: ms(22),
        borderWidth: 2.5,
        zIndex: 0,
    },
    preview: {
        width: '100%',
        height: vs(isTablet ? 180 : 140),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    info: {
        paddingHorizontal: ms(12),
        paddingVertical: ms(12),
        alignItems: 'center',
        gap: ms(8),
    },
    title: {
        color: 'white',
        fontSize: ms(14),
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(5),
        paddingHorizontal: ms(12),
        paddingVertical: ms(6),
        borderRadius: ms(20),
    },
    priceText: {
        fontWeight: '800',
        fontSize: ms(14),
        color: GOLD,
    },
    ownedBadge: {
        paddingHorizontal: ms(14),
        paddingVertical: ms(6),
        borderRadius: ms(20),
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    ownedText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        fontSize: ms(13),
    },
    equippedBadge: {
        paddingHorizontal: ms(14),
        paddingVertical: ms(6),
        borderRadius: ms(20),
        backgroundColor: 'rgba(50,205,50,0.2)',
    },
    equippedText: {
        color: LIGHT_GREEN,
        fontWeight: '800',
        fontSize: ms(13),
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: ms(20),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    lockText: {
        fontSize: ms(30),
        marginBottom: ms(4),
    },
    lockPrice: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(12),
        fontWeight: '600',
    },
    squareGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: ms(80),
        gap: ms(5),
    },
    squareItem: {
        width: ms(34),
        height: ms(34),
        borderRadius: ms(6),
    },
});
