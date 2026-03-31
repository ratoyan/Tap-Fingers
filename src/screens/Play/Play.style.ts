import {StyleSheet} from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1
    },
    countView: {
        position: 'absolute',
        right: 10,
        zIndex: 1
    },
    boxItem: {
        position: 'absolute',
    },
    headerLeftView: {
        position: 'absolute',
        left: 10,
        zIndex: 1,
        flexDirection: 'column',
        gap: 10
    },
    zIndexStyle: {
        zIndex: 1
    }
});