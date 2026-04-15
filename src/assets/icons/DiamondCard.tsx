import * as React from "react"
import Svg, {Path, Defs, LinearGradient, Stop} from "react-native-svg"

function DiamondCard(props: any) {
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
                d="M50 5 L95 50 L50 95 L5 50 Z"
                fill="url(#diamondGrad)"
                stroke="#00E5FF"
                strokeWidth={2}
            />
            <Path
                d="M50 18 L82 50 L50 82 L18 50 Z"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
            />
            <Defs>
                <LinearGradient id="diamondGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#00E5FF"/>
                    <Stop offset="100%" stopColor="#0057FF"/>
                </LinearGradient>
            </Defs>
        </Svg>
    )
}

export default DiamondCard;
