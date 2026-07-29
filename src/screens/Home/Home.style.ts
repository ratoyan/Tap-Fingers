import {StyleSheet} from "react-native";
import {vs} from "../../utils/responsive.ts";
import {LOGO_SIZE} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
        width: '100%',
    },
    // flexGrow + justifyContent:'center' keeps the menu block vertically
    // centred while the content is shorter than the viewport, and lets the
    // ScrollView take over (content grows past the centre) as soon as it isn't.
    // Padding — not margin — so the container never exceeds the viewport by the
    // offset amount and leave the screen permanently scrollable.
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: vs(20),
        paddingBottom: vs(30),
    },
    // The PNG carries a wide transparent border, so the logo is pulled up into
    // the menu to close the optical gap. Expressed as a share of LOGO_SIZE
    // (the old flat -30 was tuned against a hardcoded 160) so the overlap stays
    // proportional now that the logo scales with the viewport.
    logo: {
        marginBottom: -LOGO_SIZE * 0.19,
    },
    // Lined up with the coin pill above it (globalStyles.coinView, right: 10) so
    // the "+N" rises straight into the balance it just changed.
    coinGain: {
        right: 10,
    },
});
