import React from "react";
import {View, ViewStyle} from "react-native";
import FullHeart from "../../../assets/icons/FullHeart.tsx";
import EmptyHeart from "../../../assets/icons/EmptyHeart.tsx";

interface HeartsProps {
    viewStyle?: ViewStyle;
    length?: number;
    emptyCount?: number;
}

function Hearts({viewStyle, length = 7, emptyCount = 0}: HeartsProps) {
    return (
        <View style={[viewStyle]}>
            {Array.from({ length: length - emptyCount }).map((_, index) => (
                <FullHeart key={index}/>
            ))}
            {Array.from({ length: emptyCount }).map((_, index) => (
                <EmptyHeart key={index} color={'red'}/>
            ))}
        </View>
    );
}

export default Hearts;