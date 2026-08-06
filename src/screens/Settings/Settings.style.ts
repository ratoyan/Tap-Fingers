import {StyleSheet} from 'react-native';
import {
    DARK_PURPLE,
    GRADIENT_DARK,
    GRADIENT_LIGHT, GRAY_100,
    MEDIUM_PURPLE,
    ORCHID,
    PLUM,
    PURPLE,
    PURPLE_DARK,
    VIOLET_MEDIUM,
    WHITE
} from '../../constants/colors.ts';
import {ms, vs} from '../../utils/responsive.ts';
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    // The gradient is a full-bleed background — no padding here, or on iOS
    // (new arch) it sizes to its padded content and leaves white side gutters.
    container: {
        flex: 1,
    },
    // Side padding lives on an inner view so the gradient still fills the width.
    content: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },

    // Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(10),
        marginTop: vs(20),
        marginBottom: vs(8),
    },
    sectionTitle: {
        color: PLUM,
        fontSize: ms(10),
        fontWeight: '800',
        letterSpacing: 2.5,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        borderRadius: 2,
        opacity: 0.5,
    },

    // Card
    card: {
        backgroundColor: PURPLE,
        borderRadius: ms(18),
        paddingHorizontal: ms(16),
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.2)',
        shadowColor: PURPLE,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
    },

    // Exit button — premium pill, centered.
    // The row layout (padding/gap) lives here on the plain TouchableOpacity so
    // it measures reliably; the gradient below just fills it as a background.
    // (A LinearGradient sizing itself to row content clips the text on iOS.)
    buttonWrapper: {
        alignSelf: 'center',
        marginTop: vs(32),
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(11),
        paddingVertical: vs(13),
        paddingHorizontal: ms(26),
        borderRadius: ms(50),
        shadowColor: VIOLET_MEDIUM,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.9,
        shadowRadius: 22,
        elevation: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(196, 145, 255, 0.55)',
        overflow: 'hidden',
    },
    buttonBg: {
        ...StyleSheet.absoluteFillObject,
    },
    buttonSheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '55%',
    },
    buttonIconChip: {
        width: ms(30),
        height: ms(30),
        borderRadius: ms(15),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
    },
    buttonText: {
        color: WHITE,
        fontWeight: '800',
        fontSize: ms(13.5),
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // Unused legacy styles kept for compatibility
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
        borderColor: WHITE,
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
        color: WHITE,
    },
    greeting: {
        marginTop: vs(12),
        fontSize: ms(20),
        fontWeight: '600',
        color: WHITE,
    },
});
