import * as React from 'react';
import Svg, {Circle, Line, Path} from 'react-native-svg';

// "No connection" mark, drawn in a 100×100 box: three signal arcs rising out of
// a dot, struck through by a slash.
//
// Split into pieces on purpose. react-native-svg's own props can't be driven by
// the native animation thread, so giving each arc its own <Svg> lets a plain
// <Animated.View> fade it — which is how OfflineModal runs its "searching"
// sweep up the arcs without touching the JS thread every frame.

const CX = 50;
// Chosen so the mark is centred in its box: it runs from the top of the widest
// arc (CY - 46) to the bottom of the dot (CY + 6), and (CY-46 + CY+6)/2 = 50.
// Without this the whole thing hangs low in the ring it sits inside.
const CY = 70;
const ARC_RADII = [18, 32, 46];

/** How many arcs there are — the modal staggers one animation per arc. */
export const WIFI_ARC_COUNT = ARC_RADII.length;

// A 90° cap over the top of the dot: 45° either side of straight up.
function arcPath(r: number) {
    const k = r * Math.SQRT1_2;
    return `M ${CX - k} ${CY - k} A ${r} ${r} 0 0 1 ${CX + k} ${CY - k}`;
}

interface ArcProps {
    /** 0 = innermost. */
    index: number;
    size: number;
    color: string;
}

export function WifiArc({index, size, color}: ArcProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path
                d={arcPath(ARC_RADII[index])}
                stroke={color}
                strokeWidth={9}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
}

interface BaseProps {
    size: number;
    /** The dot at the foot of the arcs. */
    color: string;
    slashColor: string;
    /**
     * Laid down under the slash, in something close to the card behind the
     * icon: it's what makes the slash read as a gap cut through the arcs
     * rather than a line resting on top of them.
     */
    cutColor: string;
}

export function WifiBase({size, color, slashColor, cutColor}: BaseProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx={CX} cy={CY} r={6} fill={color}/>
            {/* Corner to corner through the middle of the box — the diagonal
                crosses all three arcs and clears the dot. */}
            <Line x1={14} y1={14} x2={86} y2={86} stroke={cutColor} strokeWidth={14} strokeLinecap="round"/>
            <Line x1={14} y1={14} x2={86} y2={86} stroke={slashColor} strokeWidth={6} strokeLinecap="round"/>
        </Svg>
    );
}
