import {Group, Rect} from "@shopify/react-native-skia";
import React from "react";


function PlayBox({box}: any){
    return (
        <Group
            key={box.id}
            transform={[
                {translateX: box.x + box.size[0] / 2},
                {translateY: box.y + box.size[1] / 2},
                {rotate: (box.rotation * Math.PI) / 180},
                {translateX: -box.size[0] / 2},
                {translateY: -box.size[1] / 2},
            ]}
        >
            <Rect x={0} y={0} width={box.size[0]} height={box.size[1]} color={box.color}/>
        </Group>
    )
}

export default PlayBox;