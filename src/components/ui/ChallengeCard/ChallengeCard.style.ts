import {StyleSheet} from 'react-native';
import {DARK_PURPLE, GOLD} from '../../../constants/colors.ts';
import {ms, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    card: {
        marginHorizontal: ms(10),
        marginBottom: ms(16),
        borderRadius: ms(22),
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    cardInner: {
        padding: ms(18),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(14),
        gap: ms(12),
    },
    iconBox: {
        width: ms(48),
        height: ms(48),
        borderRadius: ms(14),
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: ms(24),
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: ms(16),
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: ms(12),
        color: 'rgba(255,255,255,0.6)',
        marginTop: vs(2),
    },
    badge: {
        paddingHorizontal: ms(10),
        paddingVertical: vs(5),
        borderRadius: ms(12),
    },
    badgeText: {
        fontSize: ms(11),
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    progressTrack: {
        height: ms(10),
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: ms(10),
        overflow: 'hidden',
        marginBottom: vs(6),
    },
    progressFill: {
        height: '100%',
        borderRadius: ms(10),
    },
    progressLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: vs(14),
    },
    progressText: {
        fontSize: ms(11),
        color: 'rgba(255,255,255,0.6)',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: vs(4),
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(5),
    },
    rewardText: {
        color: GOLD,
        fontWeight: '700',
        fontSize: ms(13),
    },
    collectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(5),
        paddingHorizontal: ms(14),
        paddingVertical: vs(8),
        borderRadius: ms(16),
        backgroundColor: GOLD,
    },
    collectText: {
        color: DARK_PURPLE,
        fontWeight: '900',
        fontSize: ms(13),
    },
    lockedSubtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: ms(12),
        marginTop: vs(6),
    },
});
