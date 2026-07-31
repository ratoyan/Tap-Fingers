import React from "react";
import {Image, Text, TouchableOpacity, View, ViewStyle} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/core";
import {useTranslation} from "react-i18next";
import LinearGradient from "react-native-linear-gradient";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";

// icons
import Back from "../../../assets/icons/Back.tsx";

// components
import CoinCount from "../CoinCount/CoinCount.tsx";

// store / data
import {useAuthStore} from "../../../store/authStore.ts";
import {resolveAvatarUrl} from "../../../services/userService.ts";
import {avatarForId} from "../../../data/avatars.ts";

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
    onCoinPress?: () => void;
}

function BackHeader({
                        title,
                        backPress,
                        isShowCoin = false,
                        textStyle,
                        coins,
                        isProfile = false,
                        handleProfilePress,
                        onCoinPress,
                    }: BackHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const {t} = useTranslation();

    // Show the same profile picture the Profile screen uses: the server-stored
    // avatar if there is one, otherwise the stable per-user gradient avatar.
    // Reading straight from the auth store means a photo changed on the Profile
    // screen is reflected here as soon as the store refreshes — no manual reload.
    const player = useAuthStore(s => s.player);
    const photoUri = resolveAvatarUrl(player) || '';
    const avatar = avatarForId(player?.id);

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
                accessibilityLabel={t('goBack')}
                accessibilityHint={t('goBackHint')}
            >
                <Back/>
            </TouchableOpacity>

            <Text allowFontScaling={false} style={[styles.title, textStyle && textStyle, isProfile && {marginLeft: 0}]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  accessible={true}
                  accessibilityRole="header"
            >{title}</Text>

            {
                isShowCoin && (
                    <CoinCount count={coins} viewStyles={[styles.coinPosition, {top: insets.top + TOP_OFFSET + 5}]} onPress={onCoinPress}/>
                )
            }
            {
                isProfile && (
                    <TouchableOpacity style={[styles.avatarWrapper, {top: insets.top + TOP_OFFSET + 5}]}
                                      onPress={handleProfilePress}>
                        {photoUri ? (
                            <Image source={{uri: photoUri}} style={styles.avatar}/>
                        ) : (
                            <LinearGradient
                                colors={avatar.colors}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.avatar}
                            >
                                <Text allowFontScaling={false} style={styles.avatarEmoji}>{avatar.emoji}</Text>
                            </LinearGradient>
                        )}
                        <View style={styles.avatarRing}/>
                    </TouchableOpacity>
                )
            }
        </View>
    );
}

export default BackHeader;