import {StyleSheet} from 'react-native';
import {PLUM, WHITE} from '../../../constants/colors.ts';
import {ms, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(16),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        gap: ms(14),
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    iconBubble: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(12),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    iconText: {
        fontSize: ms(20),
    },
    label: {
        flex: 1,
        fontSize: ms(17),
        color: WHITE,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    rightSide: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    valueText: {
        fontSize: ms(15),
        fontWeight: '700',
        color: PLUM,
    },
});
