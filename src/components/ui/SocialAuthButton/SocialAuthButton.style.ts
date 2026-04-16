import {StyleSheet} from "react-native";
import {WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    button: {
        width: '90%',
        marginVertical: 15,
        borderRadius: 35,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16, // taller button
        paddingHorizontal: 25,
        borderRadius: 35,
        gap: 10
    },
    buttonTextLarge: {
        fontSize: 18,
        fontWeight: 'bold',
        color: WHITE,
    },
    ghostBorder: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    ghostText: {
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
    },
});