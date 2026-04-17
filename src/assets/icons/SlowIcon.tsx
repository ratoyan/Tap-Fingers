import * as React from "react"
import Svg, {Circle, Path, Line} from "react-native-svg"

function SlowIcon(props: any) {
    const size = props.size ?? 30
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Circle cx="32" cy="36" r="22" stroke={color} strokeWidth={3} opacity={0.9}/>
            <Path
                d="M32 22v14l8 5"
                stroke={color}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M24 6h16M32 6v6"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
            />
            <Path
                d="M14 14l-4-4M50 14l4-4"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
            />
        </Svg>
    )
}

export default SlowIcon
