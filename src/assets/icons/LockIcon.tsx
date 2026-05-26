import * as React from "react"
import Svg, {Path, Rect} from "react-native-svg"

function LockIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Rect x={4} y={10.5} width={16} height={10.5} rx={2.5} stroke={color} strokeWidth={1.8} />
            <Path
                d="M7.5 10.5V7.5a4.5 4.5 0 019 0v3"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M12 14.5v2.5"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
        </Svg>
    )
}

export default LockIcon
