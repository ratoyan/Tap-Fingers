import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

// ❄️ Freeze pickup art. A bare six-fold snowflake (no backdrop disc). Sized by
// `size` (default 48) like the other falling-object icons. All coordinates live
// in a 64×64 viewBox.
const ARMS =
    // three main diameters
    "M8 32 H56 M20 11.2 L44 52.8 M44 11.2 L20 52.8 " +
    // side branches, two per arm
    "M47 32 L51 25.1 M47 32 L51 38.9 " +
    "M39.5 19 L35.5 12.1 M39.5 19 L47.5 19 " +
    "M24.5 19 L16.5 19 M24.5 19 L28.5 12.1 " +
    "M17 32 L13 38.9 M17 32 L13 25.1 " +
    "M24.5 45 L28.5 51.9 M24.5 45 L16.5 45 " +
    "M39.5 45 L47.5 45 M39.5 45 L35.5 51.9"

function Snowflake(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            {/* Arms — deep blue underlay for depth */}
            <Path d={ARMS} stroke="#0D47A1" strokeWidth={5}
                strokeLinecap="round" strokeLinejoin="round" opacity={0.6}/>

            {/* Arms — bright blue overlay */}
            <Path d={ARMS} stroke="#40C4FF" strokeWidth={3}
                strokeLinecap="round" strokeLinejoin="round"/>

            {/* Center pip */}
            <Circle cx="32" cy="32" r="3.2" fill="#40C4FF"/>
        </Svg>
    )
}

export default Snowflake
