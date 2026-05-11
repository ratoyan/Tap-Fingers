import {StyleSheet} from 'react-native';
import {GOLD} from '../../constants/colors.ts';

export default StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         9999,
    },
    particleOrigin: {
        position:       'absolute',
        alignItems:     'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   8,
    },
    ring: {
        position:     'absolute',
        width:        160,
        height:       160,
        borderRadius: 80,
        borderWidth:  2,
        borderColor:  GOLD,
        opacity:      0,
    },
    title: {
        color:            GOLD,
        fontSize:         40,
        fontWeight:       '900',
        letterSpacing:    5,
        marginTop:        18,
        textShadowColor:  'rgba(255,180,0,0.95)',
        textShadowRadius: 22,
        textShadowOffset: {width: 0, height: 0},
    },
    subtitle: {
        color:         'rgba(255,255,255,0.45)',
        fontSize:      13,
        letterSpacing: 3.5,
        marginTop:     14,
    },
});
