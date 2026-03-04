import {StyleSheet} from "react-native";
import {BLACK, DARK_PURPLE, GOLD, MEDIUM_PURPLE, PLUM, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    coinsBox: {
        backgroundColor: GOLD,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 25,
    },
    coinsText: {
        fontWeight: "bold",
        fontSize: 16,
        color: DARK_PURPLE,
    },
    cardWrapper: {
        width: "48%",
        marginBottom: 15,
    },
    card: {
        borderRadius: 25,
        paddingVertical: 25,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "center",
        elevation: 10,
        shadowColor: BLACK,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    icon: {
        fontSize: 45,
        marginBottom: 15,
    },
    title: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
        marginTop: 5
    },
    priceContainer: {
        flexDirection: 'row',
        backgroundColor: DARK_PURPLE,
        columnGap: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 25,
    },
    price: {
        fontWeight: "bold",
        fontSize: 16,
        color: GOLD,
    },
});