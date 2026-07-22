import * as React from "react"
import Svg, {Circle, Line, Defs, LinearGradient, Stop} from "react-native-svg"

// Share-nodes glyph (three connected dots). Gold gradient by default so it ties
// to the gold score value; pass a `color` prop to render it as a flat colour.
function ShareIcon(props: any) {
    const size = props.size ?? 24
    const flat = props.color as string | undefined
    const gid = 'shareGrad'
    const paint = flat ?? `url(#${gid})`
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            {!flat && (
                <Defs>
                    <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#FFE98A"/>
                        <Stop offset="1" stopColor="#F5A623"/>
                    </LinearGradient>
                </Defs>
            )}
            {/* Links from the left node to the two right nodes */}
            <Line x1="24" y1="32" x2="41" y2="19" stroke={paint} strokeWidth={4} strokeLinecap="round"/>
            <Line x1="24" y1="32" x2="41" y2="45" stroke={paint} strokeWidth={4} strokeLinecap="round"/>
            {/* Nodes */}
            <Circle cx="46" cy="16" r="8" fill={paint}/>
            <Circle cx="46" cy="48" r="8" fill={paint}/>
            <Circle cx="18" cy="32" r="8" fill={paint}/>
        </Svg>
    )
}

export default ShareIcon
