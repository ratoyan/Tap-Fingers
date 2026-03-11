import {StyleSheet} from "react-native";
import {BLUISH_PURPLE, DARK_PURPLE, PLUM, PURPLE_LIGHT, WHITE} from "../../../constants/colors.ts";

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
    loseOverlay:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'rgba(0,0,0,0.7)'
    },
    loseModal:{
        width:280,
        padding:28,
        borderRadius:22,
        backgroundColor:DARK_PURPLE,
        alignItems:'center',
        borderWidth:2,
        borderColor:PLUM
    },
    loseTitle:{
        fontSize:28,
        fontWeight:'bold',
        marginBottom:10
    },
    loseText:{
        color:'#ddd',
        marginBottom:25,
        fontSize:16
    },
    loseRetry:{
        paddingVertical:14,
        paddingHorizontal:40,
        borderRadius:14,
        alignItems:'center'
    },
    loseBtnText:{
        color:'white',
        fontWeight:'bold',
        fontSize:16
    }
});