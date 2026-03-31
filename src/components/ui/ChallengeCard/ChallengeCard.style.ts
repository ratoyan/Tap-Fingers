import {StyleSheet} from "react-native";
import {BLACK, GOLD, MEDIUM_PURPLE, WHITE, WHITE_100} from "../../../constants/colors.ts";

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
    takenChallengeCard: {
        marginTop: 12,
        alignSelf: 'flex-start',
        backgroundColor: MEDIUM_PURPLE,
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: BLACK,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    takenChallengeText: {
        color: WHITE,
        fontWeight: '700',
        fontSize: 14
    }
});