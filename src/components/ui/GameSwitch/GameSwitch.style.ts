import {StyleSheet} from 'react-native';
import {BLACK} from '../../../constants/colors.ts';
import {ms} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    track: {
        width: ms(52),
        height: ms(30),
        borderRadius: ms(20),
        padding: 2,
    },
    thumb: {
        width: ms(26),
        height: ms(26),
        borderRadius: ms(13),
        shadowColor: BLACK,
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
});
