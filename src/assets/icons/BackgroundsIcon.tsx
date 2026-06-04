import * as React from "react"
import Svg, {Circle, Path, Rect} from "react-native-svg"

// Framed landscape (sun + mountains) — used for the Shop "Backgrounds" tab.
// Tints to a single `color` and stays legible at small tab sizes.
function BackgroundsIcon(props: any) {
    const size = props.size ?? 22
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            {/* Photo frame. */}
            <Rect
                x={3} y={4.5} width={18} height={15} rx={3}
                fill={color} fillOpacity={0.16}
                stroke={color} strokeWidth={1.7}
            />
            {/* Sun. */}
            <Circle cx={8.4} cy={9.4} r={1.9} fill={color}/>
            {/* Mountain range. */}
            <Path
                d="M3.6 18.2l4.6-5.2 2.9 3.1 3.4-4 6 6.1"
                stroke={color} strokeWidth={1.7}
                strokeLinejoin="round" strokeLinecap="round"
            />
        </Svg>
    )
}

export default BackgroundsIcon
