import * as React from "react"
import Svg, {Rect, Path} from "react-native-svg"

function VibrationIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Rect x="8" y="3" width="8" height="18" rx="2" stroke={color} strokeWidth={1.8}/>
            <Path d="M4 8v8" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
            <Path d="M2 10v4" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
            <Path d="M20 8v8" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
            <Path d="M22 10v4" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
        </Svg>
    )
}

export default VibrationIcon
