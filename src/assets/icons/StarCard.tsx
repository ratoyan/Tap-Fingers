import * as React from "react"
import Svg, {Path, Defs, LinearGradient, Stop} from "react-native-svg"

function StarCard(props: any) {
    return (
        <Svg
            width={100}
            height={100}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Path
                d="M50 5 L61 35 L93 35 L68 57 L77 88 L50 70 L23 88 L32 57 L7 35 L39 35 Z"
                fill="url(#starGrad)"
                stroke="#FFD700"
                strokeWidth={2}
            />
            <Defs>
                <LinearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFD700"/>
                    <Stop offset="100%" stopColor="#FF8C00"/>
                </LinearGradient>
            </Defs>
        </Svg>
    )
}

export default StarCard;
