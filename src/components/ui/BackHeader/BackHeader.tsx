import React, {useCallback, useState} from "react";
import {Image, Text, TouchableOpacity, View, ViewStyle} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {TOP_OFFSET} from "../../../constants/uiConstants.ts";
import {STORAGE_KEYS} from "../../../utils/storageKeys.ts";

// icons
import Back from "../../../assets/icons/Back.tsx";

// components
import CoinCount from "../CoinCount/CoinCount.tsx";

// store / data
import {useAuthStore} from "../../../store/authStore.ts";
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

    // Show the same profile picture the Profile screen uses: the device-local
    // uploaded photo if there is one, otherwise the stable per-user gradient
    // avatar. Only needed when the profile button is shown (isProfile).
    const playerId = useAuthStore(s => s.player?.id);
    const [photoUri, setPhotoUri] = useState<string>('');

    // Reload on focus so a photo changed on the Profile screen is reflected
    // here as soon as the user returns.
    useFocusEffect(
        useCallback(() => {
            if (!isProfile) return;
            AsyncStorage.getItem(STORAGE_KEYS.PROFILE_PHOTO)
                .then(uri => setPhotoUri(uri || ''))
                .catch(() => {});
        }, [isProfile])
    );

    const avatar = avatarForId(playerId);

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