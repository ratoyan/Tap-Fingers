import {StyleSheet} from "react-native";
import {BLUISH_PURPLE, PURPLE_LIGHT, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: 320,
        padding: 25,
        backgroundColor: BLUISH_PURPLE,
        borderRadius: 25,
        alignItems: "center",
        shadowColor: PURPLE_LIGHT,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.9,
        shadowRadius: 25,
        elevation: 20,
    },
    confettiPlaceholder: {
        position: "absolute",
        top: 10,
        width: "100%",
        alignItems: "center",
    },
    levelHeader: {
        width: "100%",
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: PURPLE_LIGHT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        marginTop: 50
    },
    levelText: {
        fontSize: 32,
        fontWeight: "bold",
        color: WHITE,
        textShadowColor: "#ff6a00",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    messageText: {
        fontSize: 16,
        color: WHITE,
        marginBottom: 25,
        textAlign: "center",
    },
    continueButton: {
        width: "80%",
        borderRadius: 20,
        overflow: "hidden",
    },
    buttonGradient: {
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: "center",
    },
    buttonText: {
        color: WHITE,
        fontSize: 18,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});