import {StyleSheet} from "react-native";
import {GOLD, WHITE_100} from "../../../constants/colors.ts";

export default StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: 8,
        backgroundColor: GOLD,
    },
    progressText: {
        marginTop: 8,
        color: 'white',
        fontSize: 13,
    },
    rewardView: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5
    },
    reward: {
        marginTop: 10,
        fontSize: 14,
        color: GOLD,
        fontWeight: 'bold',
    },
    lockedText: {
        color: WHITE_100,
        fontSize: 13,
    },
});