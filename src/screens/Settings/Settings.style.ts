import {StyleSheet} from 'react-native';
import {BLACK, DARK_PURPLE, PURPLE, WHITE} from '../../constants/colors.ts';
import {HORIZONAL_OFFSET} from '../../constants/uiConstants.ts';
import {ms, vs} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    card: {
        backgroundColor: 'rgba(128,0,128,0.55)',
        borderRadius: ms(20),
        padding: ms(20),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: PURPLE,
        shadowOpacity: 0.6,
        shadowRadius: 14,
        elevation: 12,
        marginTop: vs(20),
    },
    buttonWrapper: {
        marginTop: vs(22),
        borderRadius: ms(18),
        shadowColor: '#ff0000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.75,
        shadowRadius: 14,
        elevation: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(10),
        borderRadius: ms(18),
        paddingVertical: vs(16),
        borderWidth: 1.5,
        borderColor: 'rgba(255,100,100,0.5)',
    },
    buttonText: {
        color: WHITE,
        fontWeight: '800',
        fontSize: ms(17),
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 4,
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: vs(40),
    },
    avatarWrapper: {
        position: 'relative',
        marginTop: vs(30),
    },
    avatar: {
        width: ms(110),
        height: ms(110),
        borderRadius: ms(55),
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
    username: {
        fontSize: ms(20),
        fontWeight: 'bold',
        color: '#333',
    },
    greeting: {
        marginTop: vs(12),
        fontSize: ms(20),
        fontWeight: '600',
        color: '#fff',
    },
});
