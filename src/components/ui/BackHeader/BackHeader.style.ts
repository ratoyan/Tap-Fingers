import {StyleSheet} from "react-native";
import {WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    backView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        width: '70%',
        fontSize: 28,
        fontWeight: '900',
        color: WHITE,
        textAlign: 'center',
        marginLeft: 12,
    },
    backPosition: {
        position: 'absolute',
        top: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center'
    },
    coinPosition: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center'
    }
});