import * as React from "react"
import Svg, {Path, Rect, Circle, Defs, LinearGradient, RadialGradient, Stop} from "react-native-svg"

// Daily-challenges emblem: a calendar tile (the "daily" cadence) crowned with a
// gold star (the reward) and a few sparkles. Purple body + gold star match the
// app's theme. Drop-in for the section header — pass `size` to scale.
function DailyChallengeIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Defs>
                <RadialGradient id="dcGlow" cx="32" cy="32" r="30" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFD54F" stopOpacity={0.35}/>
                    <Stop offset="1" stopColor="#FFD54F" stopOpacity={0}/>
                </RadialGradient>
                <LinearGradient id="dcBody" x1="12" y1="16" x2="52" y2="56" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#A25CF5"/>
                    <Stop offset="1" stopColor="#4A148C"/>
                </LinearGradient>
                <LinearGradient id="dcHeader" x1="11" y1="15" x2="53" y2="27" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#7B1FA2"/>
                    <Stop offset="1" stopColor="#4A148C"/>
                </LinearGradient>
                <LinearGradient id="dcStar" x1="32" y1="25" x2="32" y2="49" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFF59D"/>
                    <Stop offset="0.5" stopColor="#FFD600"/>
                    <Stop offset="1" stopColor="#FFA000"/>
                </LinearGradient>
                <LinearGradient id="dcRing" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFE082"/>
                    <Stop offset="1" stopColor="#FFB300"/>
                </LinearGradient>
            </Defs>

            {/* Soft halo */}
            <Circle cx="32" cy="32" r="30" fill="url(#dcGlow)"/>

            {/* Binder rings straddling the top edge */}
            <Rect x="20" y="8" width="5" height="11" rx="2.5" fill="url(#dcRing)"/>
            <Rect x="39" y="8" width="5" height="11" rx="2.5" fill="url(#dcRing)"/>

            {/* Calendar body */}
            <Rect x="11" y="15" width="42" height="40" rx="7" fill="url(#dcBody)"/>
            {/* Header band (rounded top corners, flat bottom) */}
            <Path d="M11 26V22a7 7 0 0 1 7-7h28a7 7 0 0 1 7 7v4Z" fill="url(#dcHeader)"/>
            {/* Subtle inner highlight along the body's left/top edge */}
            <Rect x="11" y="15" width="42" height="40" rx="7" fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={1.2}/>

            {/* Reward star */}
            <Path
                d="M32 26 L34.8 34.1 L43.4 34.3 L36.6 39.5 L39 47.7 L32 42.8 L25 47.7 L27.4 39.5 L20.6 34.3 L29.2 34.1 Z"
                fill="url(#dcStar)"
                stroke="#FF8F00"
                strokeWidth={1.3}
                strokeLinejoin="round"
            />
            {/* Star glint */}
            <Circle cx="32" cy="36" r="2.4" fill="#FFFFFF" fillOpacity={0.85}/>

            {/* Sparkles */}
            <Path d="M49 11 L50 13.6 L52.6 14.6 L50 15.6 L49 18.2 L48 15.6 L45.4 14.6 L48 13.6 Z" fill="#FFECB3"/>
            <Path d="M14 46 L14.8 48 L16.8 48.8 L14.8 49.6 L14 51.6 L13.2 49.6 L11.2 48.8 L13.2 48 Z" fill="#FFE082" fillOpacity={0.9}/>
        </Svg>
    )
}

export default DailyChallengeIcon
