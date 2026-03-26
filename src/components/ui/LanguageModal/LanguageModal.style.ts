import {StyleSheet} from 'react-native';
import { PURPLE, WHITE} from "../../../constants/colors.ts";

export default StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        width: '111%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '80%',
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: 20,
    },
    title: {
        color: WHITE,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    item: {
        paddingVertical: 14,
    },
    text: {
        color: WHITE,
        fontSize: 18,
        textAlign: 'center',
    },
    selectedItem: {
        backgroundColor: WHITE,
    },
    selectedText: {
        fontWeight: 'bold',
        color: PURPLE,
    },
});