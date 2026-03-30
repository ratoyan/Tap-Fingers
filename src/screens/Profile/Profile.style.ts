import {StyleSheet} from "react-native";
import {DARK_PURPLE, PURPLE_DARK} from "../../constants/colors.ts";
import {HORIZONAL_OFFSET} from "../../constants/uiConstants.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: HORIZONAL_OFFSET
    },
    scrollContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30
    },
    avatarWrapper: {
        shadowColor: DARK_PURPLE,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        borderRadius: 70,
        marginBottom: 20,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        borderColor: PURPLE_DARK,
    },
    input: {
        width: '80%',
        padding: 14,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 22,
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3,
    },
});