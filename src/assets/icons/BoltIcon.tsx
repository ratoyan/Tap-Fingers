import * as React from "react"
import Svg, {Path, Defs, LinearGradient, Stop} from "react-native-svg"

function BoltIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Defs>
                <LinearGradient id="boltGrad" x1="20" y1="4" x2="44" y2="60" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFF176"/>
                    <Stop offset="0.5" stopColor="#FFD600"/>
                    <Stop offset="1" stopColor="#FF8F00"/>
                </LinearGradient>
            </Defs>
            {/* Bolt body */}
            <Path
                d="M37 3L16 35c-.7 1.1.1 2.5 1.4 2.5H28l-6 22c-.4 1.5 1.5 2.5 2.6 1.3l24-29c.9-1.1.1-2.8-1.3-2.8H35l5-22.6c.3-1.5-1.6-2.5-2.6-1.4z"
                fill="url(#boltGrad)"
                stroke="#F57F17"
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
            {/* Glossy highlight */}
            <Path
                d="M36 8L21 32h7l-3 14 16-19h-8l5-19z"
                fill="rgba(255,255,255,0.4)"
            />
        </Svg>
    )
}

export default BoltIcon
