import {StyleSheet} from 'react-native';
import {WHITE} from '../../../constants/colors.ts';
import {ms, scale} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    backView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        width: '70%',
        fontSize: ms(26),
        fontWeight: '900',
        color: WHITE,
        textAlign: 'center',
        marginLeft: ms(12),
    },
    backPosition: {
        position: 'absolute',
        top: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    coinPosition: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    avatar: {
        width: scale(35),
        height: scale(35),
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarRing: {
        position: 'absolute',
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        borderRadius: 61,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
});
