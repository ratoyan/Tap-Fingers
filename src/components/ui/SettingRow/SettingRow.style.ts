import {StyleSheet} from "react-native";
import {MEDIUM_PURPLE, PLUM, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: MEDIUM_PURPLE,
    },
    label: {
        fontSize: 18,
        color: WHITE,
        fontWeight: '600',
    },
    valueText: {
        fontSize: 16,
        fontWeight: '700',
        color: PLUM,
        textAlign: 'right',
    },
});