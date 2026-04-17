import * as React from "react"
import Svg, {Path} from "react-native-svg"

function ShieldIcon(props: any) {
    const size = props.size ?? 30
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Path
                d="M32 4L8 14v18c0 14 11 26 24 28 13-2 24-14 24-28V14L32 4z"
                fill={color}
                opacity={0.9}
            />
            <Path
                d="M32 4L8 14v18c0 14 11 26 24 28 13-2 24-14 24-28V14L32 4z"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
                fill="none"
            />
            <Path
                d="M22 32l7 7 13-13"
                stroke="#1a1a2e"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    )
}

export default ShieldIcon
