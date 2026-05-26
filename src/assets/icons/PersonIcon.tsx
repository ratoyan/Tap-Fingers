import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

function PersonIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M20 21v-1.5a5 5 0 00-5-5H9a5 5 0 00-5 5V21"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
        </Svg>
    )
}

export default PersonIcon
