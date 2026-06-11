import {StyleSheet} from 'react-native';
import {isTablet, ms, SW, vs} from '../../../utils/responsive.ts';
import {BLUISH_PURPLE, GOLD, GRADIENT_LIGHT, ORCHID, PURPLE, PURPLE_LIGHT, WHITE, WHITE_100} from '../../../constants/colors.ts';

export default StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouchable: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    card: {
        width: isTablet ? Math.min(SW * 0.55, 420) : '82%',
        backgroundColor: BLUISH_PURPLE,
        borderRadius: ms(28),
        paddingVertical: vs(24),
        paddingHorizontal: ms(20),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(218,112,214,0.4)',
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.6,
        shadowRadius: 28,
        elevation: 20,
    },
    iconWrap: {
        width: ms(64),
        height: ms(64),
        marginBottom: vs(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconHalo: {
        position: 'absolute',
        width: ms(64),
        height: ms(64),
        borderRadius: ms(32),
        backgroundColor: PURPLE_LIGHT,
    },
    iconBadge: {
        width: ms(56),
        height: ms(56),
        borderRadius: ms(28),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 10,
    },
    iconGlobe: {
        fontSize: ms(30),
    },
    title: {
        color: ORCHID,
        fontSize: ms(18),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: vs(14),
        letterSpacing: 0.8,
        textShadowColor: PURPLE_LIGHT,
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 8,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(218,112,214,0.2)',
        marginBottom: vs(14),
    },
    itemAnimWrap: {
        width: '100%',
        marginBottom: vs(10),
    },
    item: {
        width: '100%',
        borderRadius: ms(16),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(218,112,214,0.2)',
    },
    itemInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: ms(14),
        gap: ms(14),
        borderRadius: ms(16),
    },
    flag: {
        fontSize: ms(30),
    },
    labelCol: {
        flex: 1,
        gap: vs(2),
    },
    nativeName: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '700',
    },
    nativeNameSelected: {
        color: WHITE,
    },
    engName: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: ms(12),
        fontWeight: '500',
    },
    engNameSelected: {
        color: 'rgba(255,255,255,0.7)',
    },
    checkmark: {
        color: GOLD,
        fontSize: ms(20),
        fontWeight: '900',
    },
});
