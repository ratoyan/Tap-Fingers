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
    logoArea: {
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   12,
    },
    rippleRing: {
        position:     'absolute',
        width:        210,
        height:       210,
        borderRadius: 105,
        borderWidth:  1.5,
    },
    haloRing: {
        position:     'absolute',
        width:        224,
        height:       224,
        borderRadius: 112,
        borderWidth:  1,
        borderColor:  'rgba(255,215,0,0.18)',
    },
    titleRow: {
        flexDirection:  'row',
        alignItems:     'flex-end',
        justifyContent: 'center',
        marginTop:      10,
    },
    titleChar: {
        fontSize:   38,
        fontWeight: '900',
    },
    underline: {
        width:           180,
        height:          2,
        borderRadius:    1,
        backgroundColor: 'rgba(255,215,0,0.55)',
        marginTop:       6,
        transformOrigin: 'left',
    },
    subtitle: {
        color:         'rgba(255,255,255,0.4)',
        fontSize:      12,
        letterSpacing: 3.5,
        marginTop:     10,
    },
    progressTrack: {
        position:        'absolute',
        bottom:          42,
        left:            40,
        right:           40,
        height:          2,
        borderRadius:    1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow:        'hidden',
    },
    // Full width; the track clips it and a translateX slides it into view.
    progressFill: {
        width:        '100%',
        height:       2,
        borderRadius: 1,
        overflow:     'hidden',
    },
    versionText: {
        position:  'absolute',
        bottom:    18,
        color:     'rgba(255,255,255,0.18)',
        fontSize:  11,
        letterSpacing: 1.5,
    },
});
