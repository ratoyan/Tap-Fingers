import * as React from "react"
import Svg, {Path} from "react-native-svg"

function PlayIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M6 4.75L19.25 12 6 19.25V4.75Z"
                fill={color}
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
        </Svg>
    )
}

export default PlayIcon
