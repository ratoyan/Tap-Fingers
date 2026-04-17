import React, {useMemo} from "react";
import {Pressable, View, ViewStyle} from "react-native";
import {BoxType} from "../../../types/play.type.ts";
import {ShopType} from "../../../types/shop.type.ts";

// icons
import Card1 from "../../../assets/icons/Card1";
import Ballon from "../../../assets/icons/Ballon";
import TrackIcon from "../../../assets/icons/TrackIcon";
import StarCard from "../../../assets/icons/StarCard";
import DiamondCard from "../../../assets/icons/DiamondCard";
import HeartCard from "../../../assets/icons/HeartCard";
import BombCard from "../../../assets/icons/BombCard";
import Ghost from "../../../assets/icons/Ghost";
import FlameIcon from "../../../assets/icons/FlameIcon";
import BoltIcon from "../../../assets/icons/BoltIcon";

interface PlayBoxProps {
    box: any;
    handlePress: () => void;
}

function PlayBox({box, handlePress}: PlayBoxProps) {

    const typeName = box?.typeName?.toLowerCase?.() ?? "";
    const goldenGlow: ViewStyle = box.isGolden ? {
        borderWidth: 2.5,
        borderColor: '#FFD700',
        borderRadius: 14,
        shadowColor: '#FFD700',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 10,
    } : {};

    const baseTransform: ViewStyle["transform"] = [
        {translateX: box.x + box.size / 2},
        {translateY: box.y + box.size / 2},
        ...((box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
        {translateX: -box.size / 2},
        {translateY: -box.size / 2},
    ];

    const commonStyle: ViewStyle = {
        position: "absolute",
        transform: baseTransform,
        ...goldenGlow,
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

        return box.isBoom ? (
                <View style={commonStyle}>
                    <TrackIcon width={size[0]} height={size[1]} color={box.color || "blue"}/>
                </View>
            )
            :
            (
                <Pressable
                    onPress={handlePress}
                    style={[
                        commonStyle,
                        {
                            width: size[0],
                            height: size[1],
                            backgroundColor: box.color || "blue",
                            zIndex: 1,
                            borderRadius: 10
                        },
                    ]}
                />
            )
    }

    // ⭐ Star
    if (typeName === "star") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="#FFD700"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <StarCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 💎 Diamond
    if (typeName === "diamond") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="#00E5FF"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <DiamondCard width={100} height={100}/>
            </Pressable>
        );
    }

    // ❤️ Heart
    if (typeName === "heart") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="#FF69B4"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <HeartCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 💣 Bomb
    if (typeName === "bomb") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="#FF6600"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <BombCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 👻 Ghost
    if (typeName === "ghost") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="rgba(255,255,255,0.6)"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Ghost size={100} color={box.color ?? '#fff'} eyeColor="#4B0082"/>
            </Pressable>
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