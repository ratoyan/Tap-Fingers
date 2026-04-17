import React from "react";
import {Text, TouchableOpacity, View, ViewStyle} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/core";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";

// icons
import Back from "../../../assets/icons/Back.tsx";
import UserIcon from "../../../assets/icons/UserIcon.tsx";

// components
import CoinCount from "../CoinCount/CoinCount.tsx";

// styles
import styles from './BackHeader.style.ts'

interface BackHeaderProps {
    title: string;
    backPress?: () => void;
    isShowCoin?: boolean;
    textStyle?: ViewStyle;
    coins?: number;
    isProfile?: boolean;
    handleProfilePress?: () => void;
}

function BackHeader({
                        title,
                        backPress,
                        isShowCoin = false,
                        textStyle,
                        coins,
                        isProfile = false,
                        handleProfilePress
                    }: BackHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <View
            style={[styles.backView, {paddingTop: insets.top + TOP_OFFSET}]}
        >
            <TouchableOpacity
                style={[styles.backPosition, {top: insets.top + TOP_OFFSET + 5}]}
                onPress={() => {
                    if (backPress) {
                        backPress();
                    } else {
                        navigation.goBack();
                    }
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                accessibilityHint="Navigates to previous screen"
            >
                <Back/>
            </TouchableOpacity>

            <Text style={[styles.title, textStyle && textStyle, isProfile && {marginLeft: 0}]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  accessible={true}
                  accessibilityRole="header"
            >{title}</Text>

            {
                isShowCoin && (
                    <CoinCount count={coins} viewStyles={[styles.coinPosition, {top: insets.top + TOP_OFFSET + 5}]}/>
                )
            }
            {
                isProfile && (
                    <TouchableOpacity style={[styles.avatarWrapper, {top: insets.top + TOP_OFFSET + 5}]}
                                      onPress={handleProfilePress}>
                        <View style={styles.avatar}>
                            <UserIcon size={22} color="#fff"/>
                        </View>
                        <View style={styles.avatarRing}/>
                    </TouchableOpacity>
                )
            }
        </View>
    );
}

export default BackHeader;