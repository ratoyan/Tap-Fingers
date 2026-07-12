import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

function RetryIcon(props: any) {
    const size = props.size ?? 24
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            {/* Soft ring behind the arrow */}
            <Circle cx="32" cy="32" r="26" stroke={color} strokeWidth={2} opacity={0.18}/>
            {/* Clockwise arc, open at the top-right */}
            <Path
                d="M52 32a20 20 0 1 1-5.86-14.14"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
            />
            {/* Arrow head closing the loop */}
            <Path d="M50.6 23.4L39.9 21.2 48.3 11.4z" fill={color}/>
        </Svg>
    )
}

export default RetryIcon
