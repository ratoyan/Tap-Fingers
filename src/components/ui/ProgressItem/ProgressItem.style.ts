import {StyleSheet} from 'react-native';
import {GOLD, ORCHID, PURPLE_LIGHT, WHITE} from '../../../constants/colors.ts';
import {ms, scale, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(18),
        paddingHorizontal: ms(18),
        borderRadius: ms(24),
        marginBottom: ms(16),
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    avatar: {
        width: ms(64),
        height: ms(64),
        borderRadius: ms(32),
        borderWidth: 2.5,
        borderColor: ORCHID,
        marginRight: ms(14),
        shadowColor: ORCHID,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    info: {
        flex: 1,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: vs(8),
    },
    level: {
        fontSize: ms(18),
        color: WHITE,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    progressWrapper: {
        marginBottom: vs(8),
    },
    progressBarBackground: {
        flexDirection: 'row',
        height: ms(10),
        borderRadius: ms(5),
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    progressBarFill: {
        height: ms(10),
        backgroundColor: GOLD,
        borderRadius: ms(5),
    },
    progressLabel: {
        fontSize: ms(13),
        color: 'rgba(255,255,255,0.5)',
        marginTop: vs(4),
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(5),
    },
    score: {
        fontSize: ms(16),
        color: GOLD,
        fontWeight: '700',
    },
    scoreSuffix: {
        fontSize: ms(12),
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
});
