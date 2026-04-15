import {StyleSheet} from "react-native";
import {BLACK, DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, PURPLE, WHITE} from "../../constants/colors.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: HORIZONAL_OFFSET,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    tab: {
        flex: 1,
        height: 60,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabActive: {
        borderRadius: 14,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 0.5,
    },
    tabTextActive: {
        color: WHITE,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        overflow: 'visible',
    },
});
