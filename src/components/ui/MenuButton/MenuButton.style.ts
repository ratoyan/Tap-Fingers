import {Dimensions, StyleSheet} from "react-native";
import {BLACK, WHITE} from "../../../constants/colors.ts";
const width = Dimensions.get('window').width;

export default StyleSheet.create({
    buttonContainer: {
        marginVertical: 12,
        borderRadius: 20,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6, // Android shadow
        width: width * 0.8,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    icon: {
        fontSize: 28,
        marginRight: 16,
        color: WHITE,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: WHITE,
    },
});