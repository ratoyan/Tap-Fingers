import * as React from "react"
import Svg, {Path, Circle} from "react-native-svg"

function StarBurstIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Path
                d="M32 4l4.9 14.4H52l-12.4 8.9 4.9 14.4L32 33l-12.5 8.7 4.9-14.4L12 17.4h15.1L32 4z"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
            <Circle cx="32" cy="32" r="7" fill="rgba(255,255,255,0.4)"/>
        </Svg>
    )
}

export default StarBurstIcon
