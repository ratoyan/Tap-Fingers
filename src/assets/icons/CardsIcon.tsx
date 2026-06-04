import * as React from "react"
import Svg, {Path, Rect} from "react-native-svg"

// Two overlapping playing cards — used for the Shop "Cards" tab. Tints to a
// single `color`; the fan + heart pip keep it readable at small tab sizes.
function CardsIcon(props: any) {
    const size = props.size ?? 22
    const color = props.color ?? '#fff'
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            {/* Back card, fanned out behind. */}
            <Rect
                x={3.2} y={6} width={10.5} height={14.5} rx={2.3}
                transform="rotate(-15 8.45 13.25)"
                fill={color} fillOpacity={0.16}
                stroke={color} strokeOpacity={0.7} strokeWidth={1.5}
            />
            {/* Front card. */}
            <Rect
                x={9} y={3.5} width={11.8} height={16.5} rx={2.6}
                fill={color} fillOpacity={0.30}
                stroke={color} strokeWidth={1.7}
            />
            {/* Heart pip on the front card. */}
            <Path
                d="M14.9 9.1c.95-1.05 2.7-.42 2.7.95 0 1.35-2.7 3.25-2.7 3.25s-2.7-1.9-2.7-3.25c0-1.37 1.75-2 2.7-.95z"
                fill={color}
            />
        </Svg>
    )
}

export default CardsIcon
