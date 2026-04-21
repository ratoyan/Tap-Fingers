import {StyleSheet} from 'react-native';

export default StyleSheet.create({
    // ── Backdrop ──────────────────────────────────────────────────────────────
    backdrop: {
        flex:            1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        alignItems:      'center',
        justifyContent:  'center',
    },

    // ── Card wrapper ──────────────────────────────────────────────────────────
    cardWrapper: {
        width:    '94%',
        maxWidth: 420,
    },
    card: {
        borderRadius:      32,
        paddingTop:        26,
        paddingBottom:     20,
        paddingHorizontal: 18,
        alignItems:        'center',
        borderWidth:       1.5,
        borderColor:       'rgba(255,215,0,0.4)',
        overflow:          'hidden',
    },

    // ── Header ────────────────────────────────────────────────────────────────
    title: {
        color:            '#FFD700',
        fontSize:         28,
        fontWeight:       '900',
        letterSpacing:    3,
        textShadowColor:  'rgba(255,160,0,0.9)',
        textShadowRadius: 16,
        marginBottom:     2,
    },
    subtitle: {
        color:        'rgba(255,255,255,0.5)',
        fontSize:     12,
        marginBottom: 2,
    },
    subtitleDisabled: {
        color:        'rgba(255,255,255,0.4)',
        fontSize:     12,
        marginBottom: 2,
    },
    divider: {
        width:           '55%',
        height:          1,
        backgroundColor: 'rgba(255,215,0,0.3)',
        marginVertical:  10,
    },

    // ── Pointer arrow ─────────────────────────────────────────────────────────
    pointerWrapper: {
        marginBottom:  -4,
        zIndex:        10,
        shadowColor:   '#FFD700',
        shadowOffset:  {width: 0, height: 0},
        shadowOpacity: 1,
        shadowRadius:  10,
        elevation:     10,
    },
    pointerArrow: {
        width:            0,
        height:           0,
        borderLeftWidth:  14,
        borderRightWidth: 14,
        borderTopWidth:   22,
        borderLeftColor:  'transparent',
        borderRightColor: 'transparent',
        borderTopColor:   '#FFD700',
    },

    // ── Spin button (hub) ─────────────────────────────────────────────────────
    spinButtonFixed: {
        position:       'absolute',
        zIndex:         10,
        alignItems:     'center',
        justifyContent: 'center',
    },
    spinGradient: {
        width:          76,
        height:         76,
        borderRadius:   38,
        alignItems:     'center',
        justifyContent: 'center',
        borderWidth:    3,
        shadowOffset:   {width: 0, height: 0},
        shadowOpacity:  0.9,
        shadowRadius:   14,
        elevation:      10,
    },
    spinGradientActive: {
        borderColor: '#fff',
        shadowColor: '#FFD700',
    },
    spinGradientInactive: {
        borderColor: '#444',
        shadowColor: 'transparent',
    },
    spinText: {
        fontWeight:    '900',
        letterSpacing: 0.5,
    },
    spinTextActive: {
        color:            '#1a0033',
        fontSize:         13,
        textShadowColor:  'rgba(255,100,0,0.5)',
        textShadowRadius: 6,
    },
    spinTextInactive: {
        color:    '#555',
        fontSize: 13,
    },
    spinTextSpinning: {
        color:         '#555',
        fontSize:      26,
        letterSpacing: 0,
    },

    // ── Segment icon / label overlays ────────────────────────────────────────
    segmentIcon: {
        position:       'absolute',
        alignItems:     'center',
        justifyContent: 'center',
    },
    segmentLabel: {
        position:   'absolute',
        width:      36,
        alignItems: 'center',
    },
    segmentLabelText: {
        fontSize:   10,
        fontWeight: '900',
    },

    // ── Result banner ─────────────────────────────────────────────────────────
    resultWrapper: {
        width:     '100%',
        marginTop: 4,
    },
    resultGradient: {
        borderRadius:      22,
        paddingVertical:   18,
        paddingHorizontal: 20,
        alignItems:        'center',
        borderWidth:       1.5,
        borderColor:       '#FFD700',
    },
    resultIconWrapper: {
        marginBottom: 8,
        alignItems:   'center',
    },
    resultYouWon: {
        fontSize:      11,
        color:         'rgba(255,255,255,0.5)',
        letterSpacing: 3,
        marginBottom:  6,
    },
    resultIcon: {
        fontSize:     50,
        marginBottom: 8,
    },
    resultLabel: {
        color:            '#FFD700',
        fontSize:         24,
        fontWeight:       '900',
        letterSpacing:    1,
        textShadowColor:  'rgba(255,150,0,0.7)',
        textShadowRadius: 10,
    },

    // ── Cooldown box ──────────────────────────────────────────────────────────
    cooldownBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius:    16,
        padding:         16,
        marginTop:       4,
        width:           '100%',
        alignItems:      'center',
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.1)',
    },
    cooldownIcon: {
        fontSize:     30,
        marginBottom: 6,
    },
    cooldownText: {
        color:     'rgba(255,255,255,0.5)',
        fontSize:  13,
        textAlign: 'center',
    },

    // ── Close button ──────────────────────────────────────────────────────────
    closeButton: {
        marginTop:         18,
        paddingVertical:   11,
        paddingHorizontal: 48,
        borderRadius:      24,
        borderWidth:       1,
        borderColor:       'rgba(255,215,0,0.35)',
        backgroundColor:   'rgba(255,255,255,0.05)',
    },
    closeText: {
        color:         'rgba(255,215,0,0.75)',
        fontSize:      14,
        fontWeight:    '700',
        letterSpacing: 1,
    },

    // ── Sparkle dot ───────────────────────────────────────────────────────────
    sparkleDot: {
        position:        'absolute',
        backgroundColor: '#fff',
    },
});
