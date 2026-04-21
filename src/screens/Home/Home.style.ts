import {StyleSheet} from "react-native";
import {vs} from "../../utils/responsive.ts";
import {GOLD} from "../../constants/colors.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: vs(20),
        paddingBottom: vs(30),
    },
    logo: {
        marginBottom: vs(-30),
    },

    // ── Lucky Wheel button ─────────────────────────────────────────────────────
    wheelShadow: {
        position:      'absolute',
        left:          14,
        zIndex:        20,
        shadowColor:   GOLD,
        shadowOffset:  {width: 0, height: 6},
        shadowOpacity: 0.55,
        shadowRadius:  14,
        elevation:     14,
    },
    wheelGradient: {
        width:         70,
        paddingTop:    10,
        paddingBottom: 8,
        borderRadius:  20,
        alignItems:    'center',
        borderWidth:   1.5,
        borderColor:   GOLD,
    },
    wheelFreeBadge: {
        position:          'absolute',
        top:               -9,
        right:             -9,
        backgroundColor:   '#e63000',
        borderRadius:      9,
        paddingHorizontal: 5,
        paddingVertical:   2,
        borderWidth:       1.5,
        borderColor:       '#fff',
    },
    wheelFreeBadgeText: {
        color:         '#fff',
        fontSize:      8,
        fontWeight:    '900',
        letterSpacing: 0.5,
    },
    wheelEmoji: {
        fontSize:   30,
        lineHeight: 34,
    },
    wheelSeparator: {
        width:           '70%',
        height:          1,
        backgroundColor: 'rgba(255,215,0,0.35)',
        marginVertical:  5,
    },
    wheelSpinText: {
        color:         GOLD,
        fontSize:      9,
        fontWeight:    '900',
        letterSpacing: 1.5,
    },
});
