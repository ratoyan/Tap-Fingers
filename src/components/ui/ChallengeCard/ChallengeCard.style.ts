import {StyleSheet} from "react-native";

export default StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        elevation: 5,
    },
    title: {
        fontSize: 18,
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
        backgroundColor: '#FFD700',
    },
    progressText: {
        marginTop: 8,
        color: 'white',
        fontSize: 13,
    },
    reward: {
        marginTop: 10,
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    lockedText: {
        color: '#ddd',
        fontSize: 13,
    },
});