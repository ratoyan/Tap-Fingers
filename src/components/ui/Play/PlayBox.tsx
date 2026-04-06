import React from "react";
import {Pressable} from "react-native";

// icons
import Card1 from "../../../assets/icons/Card1.tsx";
import Ballon from "../../../assets/icons/Ballon.tsx";
import TrackIcon from "../../../assets/icons/TrackIcon.tsx";

interface PlayBoxProps {
    box: any;
    handlePress: () => void;
}

function PlayBox({box, handlePress}: PlayBoxProps) {
    return (
        // <Pressable
        //     onPress={handlePress}
        //     style={{
        //         position: "absolute", // important for translate to work
        //         width: box.size[0],
        //         height: box.size[1],
        //         backgroundColor: box.color || "blue", // optional color
        //         transform: [
        //             {translateX: box.x + box.size[0] / 2},
        //             {translateY: box.y + box.size[1] / 2},
        //             {rotate: `${box.rotation}deg`}, // rotation in degrees
        //             {translateX: -box.size[0] / 2},
        //             {translateY: -box.size[1] / 2},
        //         ],
        //     }}
        // />
        <Pressable onPress={handlePress}
                   style={{
                       position: "absolute", // important for translate to work
                       transform: [
                           {translateX: box.x + box.size[0] / 2},
                           {translateY: box.y + box.size[1] / 2},
                           // {rotate: `${box.rotation + 30}deg`}, // rotation in degrees
                           {translateX: -box.size[0] / 2},
                           {translateY: -box.size[1] / 2},
                       ],
                   }}>
            {/*<Card1 width={80} height={80}/>*/}
            {  box.isGmp ? (
                    <TrackIcon width={130} height={130} color={box.color}/>
                )
                :
                (
                    <Ballon color={box.color}/>
                )
            }
        </Pressable>
    )
}

export default PlayBox;