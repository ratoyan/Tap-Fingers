import {StyleSheet} from 'react-native';
import {DARK_PURPLE, GRADIENT_LIGHT, ORCHID, PLUM, VIOLET, WHITE} from '../../../constants/colors.ts';
import {ms, vs} from '../../../utils/responsive.ts';

export default StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    // Holds the sheet at the bottom and lifts it clear of the keyboard on iOS.
    avoider: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: DARK_PURPLE,
        borderTopLeftRadius: ms(28),
        borderTopRightRadius: ms(28),
        paddingTop: vs(14),
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: ORCHID,
        shadowOffset: {width: 0, height: -6},
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 20,
        // Never let a tall form (or an open keyboard) push the sheet past the
        // top of the screen — the ScrollView inside takes over instead.
        maxHeight: '90%',
    },
    sheetContent: {
        paddingHorizontal: ms(20),
        paddingBottom: vs(32),
    },
    // Grab area for the drag-to-dismiss gesture — deliberately tall enough to
    // be an easy target, which is why the title sits inside it.
    dragZone: {
        paddingHorizontal: ms(20),
        paddingBottom: vs(4),
    },
    handleBar: {
        width: ms(44),
        height: vs(5),
        borderRadius: ms(3),
        backgroundColor: PLUM,
        alignSelf: 'center',
        marginBottom: vs(16),
        opacity: 0.5,
    },
    title: {
        color: WHITE,
        fontSize: ms(19),
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.4,
        marginBottom: vs(20),
    },

    /* ── Fields ─────────────────────────────────────── */
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(14),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: ms(14),
        marginBottom: vs(12),
    },
    fieldRowFocused: {
        borderColor: VIOLET,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    fieldIcon: {
        marginRight: ms(10),
    },
    fieldInput: {
        flex: 1,
        color: WHITE,
        fontSize: ms(16),
        paddingVertical: vs(13),
    },

    /* ── Submit ─────────────────────────────────────── */
    submitButton: {
        width: '100%',
        borderRadius: ms(16),
        marginTop: vs(6),
        shadowColor: GRADIENT_LIGHT,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    submitGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        height: vs(54),
        borderRadius: ms(16),
    },
    submitText: {
        color: WHITE,
        fontSize: ms(17),
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    /* ── Mode toggle + footnote ─────────────────────── */
    toggleText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(14),
        textAlign: 'center',
        marginTop: vs(16),
    },
    toggleAccent: {
        color: GRADIENT_LIGHT,
        fontWeight: '800',
    },
    footnote: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(12),
        textAlign: 'center',
        marginTop: vs(14),
        letterSpacing: 0.3,
    },
});
