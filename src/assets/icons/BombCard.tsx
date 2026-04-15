import * as React from "react"
import Svg, {Circle, Path, Defs, LinearGradient, Stop} from "react-native-svg"

function BombCard(props: any) {
    return (
        <Svg
            width={100}
            height={100}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Circle
                cx={50}
                cy={58}
                r={35}
                fill="url(#bombGrad)"
                stroke="#555"
                strokeWidth={2}
            />
            <Path
                d="M50 23 L50 14"
                stroke="#888"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <Path
                d="M50 14 Q58 8 64 12"
                stroke="#FF6600"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
            />
            <Circle cx={38} cy={48} r={6} fill="rgba(255,255,255,0.15)"/>
            <Circle cx={32} cy={58} r={3} fill="rgba(255,255,255,0.1)"/>
            <Defs>
                <LinearGradient id="bombGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#555555"/>
                    <Stop offset="100%" stopColor="#1a1a1a"/>
                </LinearGradient>
            </Defs>
        </Svg>
    )
}

export default BombCard;
