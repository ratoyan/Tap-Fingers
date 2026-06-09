import * as React from "react"
import Svg, {Path, Defs, LinearGradient, RadialGradient, Stop} from "react-native-svg"

function FlameIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Defs>
                <LinearGradient id="flameOuter" x1="32" y1="2" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFB300"/>
                    <Stop offset="0.45" stopColor="#FF6B00"/>
                    <Stop offset="1" stopColor="#E53935"/>
                </LinearGradient>
                <RadialGradient id="flameInner" cx="32" cy="42" r="20" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFF59D"/>
                    <Stop offset="0.55" stopColor="#FFD54F"/>
                    <Stop offset="1" stopColor="#FF9800"/>
                </RadialGradient>
            </Defs>
            {/* Outer flame body */}
            <Path
                d="M33 3c2 9-5 14-9 20-4 6-6 11-6 17 0 11 8 19 18 19s18-8 18-19c0-7-4-13-8-17 1 4 0 8-3 10 2-6 1-13-4-19-2-3-3-7-6-11z"
                fill="url(#flameOuter)"
            />
            {/* Inner flame */}
            <Path
                d="M33 26c2 5-2 8-4 12-2 3-3 6-3 9 0 6 4 10 10 10s10-4 10-10c0-4-2-7-4-9 0 2-1 4-3 5 1-4 0-8-3-11-1-2-2-4-3-6z"
                fill="url(#flameInner)"
            />
        </Svg>
    )
}

export default FlameIcon
