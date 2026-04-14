import React, {useMemo} from "react";
import {Pressable, View, ViewStyle} from "react-native";
import {BoxType} from "../../../types/play.type.ts";
import {ShopType} from "../../../types/shop.type.ts";

// icons
import Card1 from "../../../assets/icons/Card1";
import Ballon from "../../../assets/icons/Ballon";
import TrackIcon from "../../../assets/icons/TrackIcon";

interface PlayBoxProps {
    box: BoxType;
    card: ShopType,
    handlePress: () => void;
}

function PlayBox({box, card, handlePress}: PlayBoxProps) {

    const typeName = card?.typeName?.toLowerCase?.() ?? "";

    const baseTransform: ViewStyle["transform"] = [
        {translateX: box.x + box.size[0] / 2},
        {translateY: box.y + box.size[1] / 2},
        ...((card?.rotation && box.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
        {translateX: -box.size[0] / 2},
        {translateY: -box.size[1] / 2},
    ];

    const commonStyle: ViewStyle = {
        position: "absolute",
        transform: baseTransform,
    };

    // 🎈 Ballon
    if (typeName === "ballon") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={130} height={130} color={box.color}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Ballon color={box.color}/>
            </Pressable>
        );
    }

    // 🟦 Square
    if (typeName === "square") {
        const size = useMemo(() => {
            const random = Math.floor(Math.random() * 50) + 101;
            return [random, random];
        }, []);

        return (
            <Pressable
                onPress={handlePress}
                style={[
                    commonStyle,
                    {
                        width: size[0],
                        height: size[1],
                        backgroundColor: box.color || "blue",
                    },
                ]}
            />
        );
    }

    // 🃏 Default (Card)
    return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={'#0f0f1a'}/>
            </View>
        )
        :
        (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Card1 width={100} height={100}/>
            </Pressable>
        )
}

export default PlayBox;