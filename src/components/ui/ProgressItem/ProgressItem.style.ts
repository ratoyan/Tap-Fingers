import {StyleSheet} from 'react-native';
import {GOLD, ORCHID, PURPLE_LIGHT, WHITE} from '../../../constants/colors.ts';
import {ms, scale, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(14),
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
    // Applied on top of `progressItem` for the signed-in player's own row, so
    // they can spot themselves while scrolling even when another player shares
    // the same (no-longer-unique) username.
    progressItemMe: {
        borderWidth: 2,
        borderColor: GOLD,
        backgroundColor: 'rgba(255,215,0,0.10)',
        shadowColor: GOLD,
        shadowOpacity: 0.6,
    },
    youBadge: {
        marginLeft: ms(8),
        paddingHorizontal: ms(8),
        paddingVertical: vs(2),
        borderRadius: ms(10),
        backgroundColor: GOLD,
    },
    youBadgeText: {
        fontSize: ms(11),
        fontWeight: '800',
        color: '#3A2A00',
        letterSpacing: 0.4,
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
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarEmoji: {
        fontSize: ms(30),
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
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
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: ms(8),
    },
    level: {
        fontSize: ms(18),
        color: WHITE,
        fontWeight: '800',
        letterSpacing: 0.3,
        flexShrink: 1,
    },
    progressWrapper: {
        marginBottom: vs(8),
    },
    progressBarBackground: {
        flexDirection: 'row',
        height: ms(10),
        borderRadius: ms(10),
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    // Full width, revealed by scaleX from the left. No radius of its own — the
    // track clips to its own rounded corners, and a radius here would stretch
    // into an ellipse as the bar scales.
    progressBarFill: {
        width: '100%',
        height: ms(10),
        backgroundColor: GOLD,
        transformOrigin: 'left',
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
