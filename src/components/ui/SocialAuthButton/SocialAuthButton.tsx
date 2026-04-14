import {Text, TouchableOpacity, View} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import React from "react";

import GoogleLogo from "../../../assets/icons/GoogleLogo";
import AppleLogo from "../../../assets/icons/AppleLogo";

import styles from './SocialAuthButton.style';

interface SocialAuthButtonProps {
    type: 'google' | 'apple' | 'ghost';
    handlePress?: () => void;
}

const config: any = {
    google: {
        colors: ['#FF5F6D', '#FFC371'],
        text: 'Sign in with Google',
        Icon: GoogleLogo,
    },
    apple: {
        colors: ['#333', '#000'],
        text: 'Sign in with Apple',
        Icon: AppleLogo,
    }
} as const;

function SocialAuthButton({type, handlePress}: SocialAuthButtonProps) {
    const {colors, text, Icon} = config[type];

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress}>
            <LinearGradient
                colors={colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.gradientButton}
            >
                <View
                    style={[
                        type === 'apple' && {paddingBottom: 5},
                    ]}>
                    <Icon />
                </View>
                <Text style={styles.buttonTextLarge}>{text}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default SocialAuthButton;