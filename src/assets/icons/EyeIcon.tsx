import * as React from "react"
import Svg, {Path, Circle, Line} from "react-native-svg"

// Password visibility toggle icon. `off` renders the "hidden" (slashed) eye,
// otherwise the open eye. Matches the stroke style of LockIcon/MailIcon.
function EyeIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    const off = !!props.off
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
            {off && (
                <Line x1={4} y1={4} x2={20} y2={20} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            )}
        </Svg>
    )
}

export default EyeIcon
