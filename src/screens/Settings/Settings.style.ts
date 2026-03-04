import {StyleSheet} from "react-native";
import {BLACK, DARK_PURPLE, PURPLE, WHITE} from "../../constants/colors.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_PURPLE,
        paddingHorizontal: HORIZONAL_OFFSET,
    },
    card: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: 20,
        shadowColor: BLACK,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
        marginTop: 20
    },
    button: {
        marginTop: 22,
        borderWidth: 2,
        borderColor: WHITE,
        backgroundColor: DARK_PURPLE,
        borderRadius: 16,
        paddingVertical: 14,
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        color: WHITE,
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        textShadowColor: BLACK,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
    },
});