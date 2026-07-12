import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

function BackArrowIcon(props: any) {
    const size = props.size ?? 24
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            {/* Soft ring, matching RetryIcon */}
            <Circle cx="32" cy="32" r="26" stroke={color} strokeWidth={2} opacity={0.18}/>
            {/* Shaft */}
            <Path
                d="M45 32H23"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
            />
            {/* Head */}
            <Path
                d="M30 21L19 32l11 11"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    )
}

export default BackArrowIcon
