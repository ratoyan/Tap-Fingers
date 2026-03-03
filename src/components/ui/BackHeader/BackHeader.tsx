import {Text, TouchableOpacity, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/core";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";

// icons
import Back from "../../../assets/icons/Back.tsx";

// styles
import styles from './BackHeader.style.ts'

interface BackHeaderProps {
    title: string;
    backPress?: () => void;
}

function BackHeader({title, backPress}: BackHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <View
            style={[styles.backView, {paddingTop: insets.top + TOP_OFFSET}]}
        >

            <TouchableOpacity style={[styles.backPosition, {top: insets.top + TOP_OFFSET + 5}]} onPress={() => {
                if (backPress) {
                    backPress();
                } else {
                    navigation.goBack();
                }
            }}>
                <Back/>
            </TouchableOpacity>

            <Text style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail">{title}</Text>
        </View>
    );
}

export default BackHeader;