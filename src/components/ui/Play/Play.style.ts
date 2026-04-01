import {StyleSheet} from "react-native";
import {BLUISH_PURPLE, DARK_PURPLE, GOLD, PLUM, PURPLE_LIGHT, WHITE, WHITE_100} from "../../../constants/colors.ts";

export default StyleSheet.create({
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: 320,
        padding: 25,
        backgroundColor: BLUISH_PURPLE,
        borderRadius: 25,
        alignItems: "center",
        shadowColor: PURPLE_LIGHT,
        shadowOffset: {width: 0, height: 15},
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
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 20,
        marginTop: 50
    },
    levelText: {
        fontSize: 32,
        fontWeight: "bold",
        color: WHITE,
        textShadowColor: "#ff6a00",
        textShadowOffset: {width: 0, height: 0},
        textShadowRadius: 15,
        textTransform: 'uppercase'
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
    loseOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loseModal: {
        width: 280,
        padding: 28,
        borderRadius: 22,
        backgroundColor: DARK_PURPLE,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: PLUM
    },
    loseTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    loseText: {
        color: WHITE_100,
        marginBottom: 25,
        fontSize: 16,
        textAlign: 'center'
    },
    loseRetry: {
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
        alignItems: 'center'
    },
    loseBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center'
    },
    levelContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

        position: "absolute",
        top: 0,
        left: "50%",

        transform: [{translateX: -50}],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,

        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 1
    },
    levelIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    levelLabel: {
        color: WHITE,
        fontSize: 10,
        marginRight: 6,
        fontWeight: "600",
        letterSpacing: 1,
    },
    level: {
        color: WHITE,
        fontSize: 16,
        fontWeight: "bold",
    },
    progressBarFill: {
        backgroundColor: GOLD,
    },
    progressBarEmpty: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressBarBackground: {
        position: 'absolute',
        width: '60%',
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
        zIndex: 1,
        top: 100,
        left: "17%",
    },
});