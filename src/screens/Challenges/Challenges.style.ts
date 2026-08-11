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
});