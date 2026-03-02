import {StyleSheet} from "react-native";
import {WHITE} from "../../constants/colors.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: WHITE,
        fontFamily: '',
    },

    icon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },

    buttonText: {
        fontSize: 16,
        color: WHITE,
        fontWeight: 'bold',
    },

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
});