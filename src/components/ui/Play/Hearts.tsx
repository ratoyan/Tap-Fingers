import React, {useEffect, useRef} from "react";
import {Animated, Easing, View, ViewStyle} from "react-native";

// icons
import FullHeart from "../../../assets/icons/FullHeart.tsx";
import EmptyHeart from "../../../assets/icons/EmptyHeart.tsx";

interface HeartsProps {
    viewStyle?: ViewStyle;
    length?: number;
    emptyCount?: number;
    animating?: boolean;
}

function Hearts({viewStyle, length = 7, emptyCount = 0, animating = false}: HeartsProps) {
    const shakeAnims = useRef(
        Array.from({length: 7}, () => new Animated.Value(0))
    ).current;

    useEffect(() => {
        if (!animating) return;

        const animations = shakeAnims.map((anim, i) =>
            Animated.sequence([
                Animated.delay(i * 60),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {toValue: -6, duration: 60, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 6, duration: 60, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: -4, duration: 50, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 4, duration: 50, easing: Easing.linear, useNativeDriver: true}),
                        Animated.timing(anim, {toValue: 0, duration: 40, easing: Easing.linear, useNativeDriver: true}),
                    ]),
                    {iterations: 3}
                ),
            ])
        );

        Animated.parallel(animations).start(() => {
            shakeAnims.forEach(a => a.setValue(0));
        });
    }, [animating]);

    return (
        <View style={viewStyle}>
            {Array.from({length}).map((_, index) => {
                const isEmpty = index >= length - emptyCount;
                return (
                    <Animated.View key={index} style={{transform: [{translateX: shakeAnims[index] ?? new Animated.Value(0)}]}}>
                        {isEmpty ? <EmptyHeart color="red"/> : <FullHeart/>}
                    </Animated.View>
                );
            })}
        </View>
    );
}

export default Hearts;
