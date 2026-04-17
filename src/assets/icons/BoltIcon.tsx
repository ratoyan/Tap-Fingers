import * as React from "react"
import Svg, {Path} from "react-native-svg"

function BoltIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Path
                d="M38 4L18 36h16l-8 24 30-32H22L38 4z"
                fill="#FFD700"
                stroke="#FF8C00"
                strokeWidth={2}
                strokeLinejoin="round"
            />
            <Path
                d="M38 4L18 36h16l-8 24 30-32H22L38 4z"
                fill="rgba(255,255,255,0.25)"
            />
        </Svg>
    )
}

export default BoltIcon
