import {StyleSheet} from "react-native";

export default StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingRight: 10,
        paddingLeft: 5,
        paddingVertical: 5,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: "gold",
        fontWeight: "bold",
        fontSize: 16,
        marginLeft: 10,
    },
});