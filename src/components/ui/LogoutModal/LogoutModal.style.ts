import {StyleSheet} from "react-native";
import {DARK_PURPLE, GRAY, GRAY_100, WHITE, WHITE_50} from "../../../constants/colors.ts";

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
    modalContainer: {
        width: '80%',
        backgroundColor: WHITE,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
        color: GRAY,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: GRAY_100,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: WHITE_50,
    },
    confirmButton: {
        backgroundColor: DARK_PURPLE,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: GRAY_100,
    },
    confirmText: {
        color: WHITE,
    },
});