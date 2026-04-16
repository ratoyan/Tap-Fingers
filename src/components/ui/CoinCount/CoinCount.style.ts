import {StyleSheet} from 'react-native';
import {ms, scale, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingRight: scale(10),
        paddingLeft: scale(5),
        paddingVertical: vs(6),
        borderRadius: ms(15),
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: 'gold',
        fontWeight: 'bold',
        fontSize: ms(15),
        marginLeft: scale(10),
    },
});
