import React from "react";
import { Pressable, ViewStyle } from "react-native";

// icons
import Card1 from "../../../assets/icons/Card1";
import Ballon from "../../../assets/icons/Ballon";
import TrackIcon from "../../../assets/icons/TrackIcon";

interface BoxType {
    x: number;
    y: number;
    size: [number, number];
    rotation?: number;
    color?: string;
    isBoom?: boolean;
}

interface PlayBoxProps {
    box: BoxType;
    card: any,
    handlePress: () => void;
}

function PlayBox({ box, card, handlePress }: PlayBoxProps) {

    let typeName = card?.typeName ?? ''

    const baseTransform: ViewStyle["transform"] = [
        { translateX: box.x + box.size[0] / 2 },
        { translateY: box.y + box.size[1] / 2 },
        ...((card?.rotation && box.rotation) ? [{ rotate: `${box.rotation}deg` }] : []),
        { translateX: -box.size[0] / 2 },
        { translateY: -box.size[1] / 2 },
    ];

    const commonStyle: ViewStyle = {
        position: "absolute",
        transform: baseTransform,
    };

    // 🎈 Ballon
    if (typeName === "ballon") {
        return (
            <Pressable onPress={handlePress} style={commonStyle}>
                {box.isBoom ? (
                    <TrackIcon width={130} height={130} color={box.color} />
                ) : (
                    <Ballon color={box.color} />
                )}
            </Pressable>
        );
    }

    // 🟦 Square
    if (typeName === "square") {
        return (
            <Pressable
                onPress={handlePress}
                style={[
                    commonStyle,
                    {
                        width: box.size[0],
                        height: box.size[1],
                        backgroundColor: box.color || "blue",
                    },
                ]}
            />
        );
    }

    // 🃏 Default (Card)
    return (
        <Pressable onPress={handlePress} style={commonStyle}>
            <Card1 width={80} height={80} />
        </Pressable>
    );
}

export default PlayBox;