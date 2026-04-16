import {Text, TouchableOpacity, View} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import React from "react";

import GoogleLogo from "../../../assets/icons/GoogleLogo";
import AppleLogo from "../../../assets/icons/AppleLogo";
import Ghost from "../../../assets/icons/Ghost.tsx";

import styles from './SocialAuthButton.style';

interface SocialAuthButtonProps {
    type: 'google' | 'apple' | 'ghost';
    handlePress?: () => void;
}

const config = {
    google: {
        colors: ['#FF5F6D', '#FFC371'] as [string, string],
        text: 'Sign in with Google',
        Icon: GoogleLogo,
        isGhost: false,
    },
    apple: {
        colors: ['#333', '#000'] as [string, string],
        text: 'Sign in with Apple',
        Icon: AppleLogo,
        isGhost: false,
    },
    ghost: {
        colors: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.06)'] as [string, string],
        text: 'Continue as Guest',
        Icon: null,
        isGhost: true,
    },
} as const;

function SocialAuthButton({type, handlePress}: SocialAuthButtonProps) {
    const {colors, text, Icon, isGhost} = config[type];

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress}>
            <LinearGradient
                colors={colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.gradientButton, isGhost && styles.ghostBorder]}
            >
                <View style={[type === 'apple' && {paddingBottom: 5}]}>
                    {isGhost
                        ? <Ghost size={28} color="rgba(255,255,255,0.85)" eyeColor="#9370DB" />
                        : Icon && <Icon />
                    }
                </View>
                <Text style={[styles.buttonTextLarge, isGhost && styles.ghostText]}>
                    {text}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default SocialAuthButton;
