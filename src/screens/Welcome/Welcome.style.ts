import {StyleSheet} from 'react-native';
import {WHITE} from '../../constants/colors.ts';
import {ms, scale} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: ms(20),
    },
    title: {
        fontSize: ms(32),
        fontWeight: 'bold',
        color: WHITE,
        fontFamily: '',
    },
    logoRow: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ghostWrap: {
        position: 'absolute',
        right: -ms(30),
        bottom: ms(10),
    },
    buttonsWrap: {
        width: '100%',
        alignItems: 'center',
    },
    icon: {
        width: ms(24),
        height: ms(24),
        marginRight: ms(12),
    },
    buttonText: {
        fontSize: ms(16),
        color: WHITE,
        fontWeight: 'bold',
    },
    button: {
        width: '90%',
        marginVertical: ms(15),
        borderRadius: ms(35),
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: ms(16),
        paddingHorizontal: ms(25),
        borderRadius: ms(35),
        gap: ms(10),
    },
    buttonTextLarge: {
        fontSize: ms(18),
        fontWeight: 'bold',
        color: WHITE,
    },
});
