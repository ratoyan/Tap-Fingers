import { StyleSheet, Dimensions } from 'react-native';
import {BLACK, WHITE} from "../../../constants/colors.ts";

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    buttonContainer: {
        marginVertical: height * 0.015,
        borderRadius: 20,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        width: width * 0.8,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: height * 0.022,
        paddingHorizontal: width * 0.06,
        borderRadius: 20,
    },
    icon: {
        fontSize: width * 0.07,
        marginRight: width * 0.03,
        color: WHITE,
    },
    title: {
        fontSize: width * 0.05,
        fontWeight: '700',
        color: WHITE,
    },
});