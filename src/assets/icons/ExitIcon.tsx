import * as React from "react"
import Svg, {Path, Rect} from "react-native-svg"

function ExitIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M16 17l5-5-5-5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M21 12H9"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    )
}

export default ExitIcon
