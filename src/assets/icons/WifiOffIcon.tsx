import * as React from 'react';
import {Animated} from 'react-native';
import Svg, {Circle, Line, Path} from 'react-native-svg';

// "No connection" mark: three signal arcs rising out of a dot, struck through
// by a slash. Drawn in a 100×100 box.
//
// Everything lives in ONE <Svg>. An earlier version gave each arc its own so a
// wrapping <Animated.View> could fade it on the native thread; on Android those
// stacked SVG views each painted an opaque backing, which showed up on device as
// a dark octagon behind the mark (the square backing, chamfered by the round
// icon ring). One canvas has no such seam — and the arcs are animated directly
// instead, which is what AnimatedPath is for.

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CX = 50;
// Chosen so the mark is centred in its box: it runs from the top of the widest
// arc (CY - 46) to the bottom of the dot (CY + 6), and (CY-46 + CY+6)/2 = 50.
// Without this the whole thing hangs low in the ring it sits inside.
const CY = 70;
const ARC_RADII = [18, 32, 46];

/** How many arcs there are — the modal drives one opacity per arc. */
export const WIFI_ARC_COUNT = ARC_RADII.length;

// A 90° cap over the top of the dot: 45° either side of straight up.
function arcPath(r: number) {
    const k = r * Math.SQRT1_2;
    return `M ${CX - k} ${CY - k} A ${r} ${r} 0 0 1 ${CX + k} ${CY - k}`;
}

interface Props {
    size: number;
    /** The arcs and the dot at their foot. */
    color: string;
    slashColor: string;
    /**
     * Laid down under the slash, in something close to the card behind the
     * icon: it's what makes the slash read as a gap cut through the arcs
     * rather than a line resting on top of them.
     */
    cutColor: string;
    /** One opacity per arc, innermost first. WIFI_ARC_COUNT of them. */
    arcOpacities: Animated.AnimatedInterpolation<number>[];
}

export default function WifiOffIcon({size, color, slashColor, cutColor, arcOpacities}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            {ARC_RADII.map((r, i) => (
                <AnimatedPath
                    key={`arc-${i}`}
                    d={arcPath(r)}
                    stroke={color}
                    strokeWidth={9}
                    strokeLinecap="round"
                    fill="none"
                    opacity={arcOpacities[i]}
                />
            ))}
            <Circle cx={CX} cy={CY} r={6} fill={color}/>
            {/* Corner to corner through the middle of the box — the diagonal
                crosses all three arcs and clears the dot. */}
            <Line x1={14} y1={14} x2={86} y2={86} stroke={cutColor} strokeWidth={14} strokeLinecap="round"/>
            <Line x1={14} y1={14} x2={86} y2={86} stroke={slashColor} strokeWidth={6} strokeLinecap="round"/>
        </Svg>
    );
}
