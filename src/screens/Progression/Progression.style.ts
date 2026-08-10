import {StyleSheet} from "react-native";
import {PURPLE_DARK} from "../../constants/colors.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";
import {ms, vs} from "../../utils/responsive.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PURPLE_DARK,
        // paddingHorizontal: HORIZONAL_OFFSET
    },
    // The signed-in player's own row, pinned over the bottom of the list so
    // their standing stays visible no matter how far the leaderboard scrolls.
    pinned: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // Opaque band so leaderboard rows scrolling underneath don't peek
        // through the gaps around the pinned card.
        backgroundColor: PURPLE_DARK,
        paddingTop: vs(8),
    },
    pinnedDivider: {
        height: ms(2),
        borderRadius: ms(2),
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginBottom: vs(8),
    },
});