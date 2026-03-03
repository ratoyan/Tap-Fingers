import {StyleSheet} from "react-native";
import {BLACK, GOLD, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        marginBottom: 15,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: WHITE,
        marginRight: 15,
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
    },
    info: {
        flex: 1,
    },
    level: {
        fontSize: 22,
        color: WHITE,
        fontWeight: '800',
        marginBottom: 6,
    },
    progressBarBackground: {
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        backgroundColor: GOLD,
    },
    progressBarEmpty: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    score: {
        fontSize: 18,
        color: WHITE,
        fontWeight: '700',
        marginRight: 6,
    },
});
