import * as React from "react"
import Svg, {Path, Defs, LinearGradient, Stop} from "react-native-svg"

function HeartCard(props: any) {
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
                d="M50 85 C50 85 10 58 10 32 C10 18 20 8 33 8 C40 8 47 12 50 18 C53 12 60 8 67 8 C80 8 90 18 90 32 C90 58 50 85 50 85 Z"
                fill="url(#heartGrad)"
                stroke="#FF69B4"
                strokeWidth={2}
            />
            <Path
                d="M35 25 C30 25 25 30 25 36"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={3}
                strokeLinecap="round"
            />
            <Defs>
                <LinearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FF69B4"/>
                    <Stop offset="100%" stopColor="#C2185B"/>
                </LinearGradient>
            </Defs>
        </Svg>
    )
}

export default HeartCard;
