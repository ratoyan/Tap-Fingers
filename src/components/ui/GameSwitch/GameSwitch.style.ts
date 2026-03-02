import {StyleSheet} from "react-native";
import {BLACK} from "../../../constants/colors.ts";

export default StyleSheet.create({
    track: {
        width: 52,
        height: 30,
        borderRadius: 20,
        padding: 2,
    },
    thumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        shadowColor: BLACK,
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    }
});