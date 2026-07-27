import * as React from "react"
import Svg, {Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop} from "react-native-svg"

// Ferris wheel, split in two so only the top half turns: <FerrisWheelRim/> is
// the wheel (hub-centred, so a plain rotate transform spins it true) and
// <FerrisWheelStand/> is the A-frame + hub cap that stays planted. Stack them —
// rim underneath, stand on top — and the legs read as being in front of the
// cabins, which is how a real wheel looks.
//
// Both take `size` = the wheel's diameter. The stand is FERRIS_ASPECT taller,
// since the legs run below the hub.

/** Stand height ÷ wheel diameter. Size the container with this. */
export const FERRIS_ASPECT = 1.12;

const GOLD_LIGHT = '#FFE082';
const GOLD_DEEP = '#FF8F00';

// Cabin seats, every 45° starting at 12 o'clock: [x, y, fill, stroke].
const CABINS: [number, number, string, string][] = [
    [50, 8.5, '#FFD600', '#FF8F00'],
    [79.34, 20.66, '#00E5FF', '#0091EA'],
    [91.5, 50, '#FF4FD8', '#AA00AA'],
    [79.34, 79.34, '#B388FF', '#6200EA'],
    [50, 91.5, '#FFD600', '#FF8F00'],
    [20.66, 79.34, '#00E5FF', '#0091EA'],
    [8.5, 50, '#FF4FD8', '#AA00AA'],
    [20.66, 20.66, '#B388FF', '#6200EA'],
];

// Spoke ends on the rim (r = 34), same eight angles as the cabins.
const SPOKES: [number, number][] = [
    [50, 16], [74.04, 25.96], [84, 50], [74.04, 74.04],
    [50, 84], [25.96, 74.04], [16, 50], [25.96, 25.96],
];

// Bulbs sitting between the spokes (r = 34, offset 22.5°) — they're what makes
// the rotation legible at icon size.
const BULBS: [number, number][] = [
    [63.01, 18.6], [81.4, 36.99], [81.4, 63.01], [63.01, 81.4],
    [36.99, 81.4], [18.6, 63.01], [18.6, 36.99], [36.99, 18.6],
];

export function FerrisWheelRim({size = 34}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="fwRim" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
            </Defs>

            {/* Spokes first, so the rim and the cabins cap their ends. */}
            <G stroke="url(#fwRim)" strokeWidth={2.6} strokeLinecap="round">
                {SPOKES.map(([x, y], i) => (
                    <Line key={i} x1="50" y1="50" x2={x} y2={y}/>
                ))}
            </G>

            {/* Double rim: the inner ring gives the frame some depth. */}
            <Circle cx="50" cy="50" r="34" stroke="url(#fwRim)" strokeWidth={3.4} fill="none"/>
            <Circle cx="50" cy="50" r="26" stroke={GOLD_LIGHT} strokeOpacity={0.45} strokeWidth={1.6} fill="none"/>

            {BULBS.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={2} fill="#FFFDE7"/>
            ))}

            {CABINS.map(([x, y, fill, stroke], i) => (
                <G key={i}>
                    <Circle cx={x} cy={y} r={7} fill={fill} stroke={stroke} strokeWidth={1.6}/>
                    <Circle cx={x - 2} cy={y - 2.4} r={2} fill="#FFFFFF" fillOpacity={0.55}/>
                </G>
            ))}
        </Svg>
    )
}

export function FerrisWheelStand({size = 34}: {size?: number}) {
    return (
        <Svg width={size} height={size * FERRIS_ASPECT} viewBox="0 0 100 112" fill="none">
            <Defs>
                <LinearGradient id="fwLeg" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFCA28"/>
                    <Stop offset="1" stopColor="#E65100"/>
                </LinearGradient>
            </Defs>

            {/* A-frame down to the ground, with a brace across the shins. */}
            <G stroke="url(#fwLeg)" strokeWidth={5} strokeLinecap="round">
                <Line x1="50" y1="50" x2="24" y2="102"/>
                <Line x1="50" y1="50" x2="76" y2="102"/>
            </G>
            <Line x1="34" y1="78" x2="66" y2="78" stroke={GOLD_LIGHT} strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round"/>
            <Rect x="14" y="100" width="72" height="8" rx="4" fill="url(#fwLeg)"/>

            {/* Hub cap last: it hides where the spokes meet, so the wheel looks
                bolted to the frame instead of floating over it. */}
            <Circle cx="50" cy="50" r="9" fill="url(#fwLeg)"/>
            <Circle cx="50" cy="50" r="4" fill="#3E1A00"/>
            <Path d="M46 45.5a5.5 5.5 0 0 1 4-2" stroke="#FFFDE7" strokeOpacity={0.8} strokeWidth={1.6} strokeLinecap="round" fill="none"/>
        </Svg>
    )
}
