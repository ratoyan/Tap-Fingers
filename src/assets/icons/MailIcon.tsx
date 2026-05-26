import * as React from "react"
import Svg, {Path, Rect} from "react-native-svg"

function MailIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Rect x={2.5} y={4.5} width={19} height={15} rx={2.5} stroke={color} strokeWidth={1.8} />
            <Path
                d="M3.5 7l7.06 5.29a2.4 2.4 0 002.88 0L20.5 7"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    )
}

export default MailIcon
