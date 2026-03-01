import {Dimensions, StyleSheet} from "react-native";

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingRight: width * 0.025,
        paddingLeft: width * 0.0125,
        paddingVertical: height * 0.008,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: "gold",
        fontWeight: "bold",
        fontSize: width * 0.04, // proportional font size
        marginLeft: width * 0.025,
    },
});