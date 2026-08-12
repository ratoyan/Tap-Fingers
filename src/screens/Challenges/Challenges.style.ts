import {StyleSheet} from "react-native";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    // Full-bleed gradient background — no padding here, or on iOS (new arch)
    // it sizes to its padded content and leaves white side gutters.
    container: {
        flex: 1,
    },
    // Side padding lives on an inner view so the gradient still fills the width.
    content: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    // Breathing room between the header row and the daily challenges below it.
    header: {
        paddingBottom: 20,
    },
    // A nicer coin pill for this screen's header: a soft golden hairline border
    // over the shared dark pill, so the balance reads as a framed badge rather
    // than a bare coin + number. Scoped here so Home/Shop/Play keep their look.
    coinPill: {
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.45)',
        paddingHorizontal: 12,
    },
    // Sticky "🏆 Challenges" bar. The fill lives on a separate, faded layer
    // (sectionHeaderBg) so it only shows once the bar pins to the top; overflow
    // clips that gradient to the bar's bounds.
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingTop: 16,
        paddingBottom: 8,
        overflow: 'hidden',
    },
    // Opaque fill + gold underline for the pinned bar, faded in with the coin so
    // catalog cards don't show through while it's stuck to the top.
    sectionHeaderBg: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.18)',
    },
});