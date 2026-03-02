import React, {useEffect, useRef} from "react";
import {Animated, TouchableOpacity} from "react-native";

// styles
import styles from './GameSwitch.style.ts';
import {DARK_PURPLE, ORCHID, PLUM, PURPLE} from "../../../constants/colors.ts";

interface GameSwitchProps {
    value: boolean;
    onChange: (val: boolean) => void;
}

function GameSwitch({
                        value,
                        onChange,
                    }: GameSwitchProps) {
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: value ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 20],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onChange(!value)}
            style={[
                styles.track,
                {backgroundColor: value ? PLUM : DARK_PURPLE},
            ]}
        >
            <Animated.View
                style={[
                    styles.thumb,
                    {
                        transform: [{translateX}],
                        backgroundColor: value ? PURPLE : ORCHID,
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

export default GameSwitch;