import * as React from "react"
import Svg, {Path, Circle, Defs, LinearGradient, RadialGradient, Stop} from "react-native-svg"

function StarBurstIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Defs>
                <LinearGradient id="starGrad" x1="32" y1="4" x2="32" y2="58" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFF59D"/>
                    <Stop offset="0.5" stopColor="#FFD600"/>
                    <Stop offset="1" stopColor="#FFA000"/>
                </LinearGradient>
                <RadialGradient id="starCore" cx="32" cy="30" r="10" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>
            {/* Sparkle rays behind the star */}
            <Path
                d="M32 0l2 8-2 4-2-4 2-8zM32 64l-2-8 2-4 2 4-2 8zM0 32l8-2 4 2-4 2-8-2zM64 32l-8 2-4-2 4-2 8 2z"
                fill="#FFE082"
                opacity={0.7}
            />
            {/* Main 5-point star */}
            <Path
                d="M32 6l6.6 13.4 14.8 2.1-10.7 10.4 2.5 14.7L32 39.7l-13.2 6.9 2.5-14.7L10.6 21.5l14.8-2.1L32 6z"
                fill="url(#starGrad)"
                stroke="#FF8F00"
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
            {/* Glow core */}
            <Circle cx="32" cy="30" r="9" fill="url(#starCore)"/>
        </Svg>
    )
}

export default StarBurstIcon
