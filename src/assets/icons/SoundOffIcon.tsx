import * as React from "react"
import Svg, {Path} from "react-native-svg"

function SoundOffIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M11 5L6 9H2v6h4l5 4V5z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M16 9l6 6"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            <Path
                d="M22 9l-6 6"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
        </Svg>
    )
}

export default SoundOffIcon
