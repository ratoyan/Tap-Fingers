import {StyleSheet} from "react-native";
import {vs} from "../../utils/responsive.ts";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: vs(20),
        paddingBottom: vs(30),
    },
    logo: {
        marginBottom: vs(-30),
    },
});
