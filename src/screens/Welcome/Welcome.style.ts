import {StyleSheet} from 'react-native';
import {WHITE} from '../../constants/colors.ts';
import {ms, vs, scale} from '../../utils/responsive.ts';

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: ms(20),
    },
    flex: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: vs(24),
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
    soundButton: {
        position: 'absolute',
        right: ms(16),
        width: ms(44),
        height: ms(44),
        borderRadius: ms(22),
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    // ── Email auth form ─────────────────────────────────────────────
    input: {
        width: '90%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: ms(16),
        paddingVertical: vs(14),
        paddingHorizontal: ms(18),
        fontSize: ms(16),
        color: WHITE,
        marginVertical: vs(7),
    },
    primaryButton: {
        width: '90%',
        marginTop: vs(14),
        borderRadius: ms(35),
        overflow: 'hidden',
    },
    primaryGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(16),
        borderRadius: ms(35),
        minHeight: vs(54),
    },
    primaryText: {
        fontSize: ms(18),
        fontWeight: 'bold',
        color: WHITE,
    },
    toggleText: {
        marginTop: vs(16),
        fontSize: ms(14),
        color: 'rgba(255,255,255,0.7)',
    },
    toggleTextAccent: {
        color: WHITE,
        fontWeight: 'bold',
    },
    divider: {
        width: '70%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginVertical: vs(18),
    },
});
