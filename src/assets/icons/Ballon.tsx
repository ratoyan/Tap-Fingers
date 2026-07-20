import * as React from "react"
import Svg, {Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop} from "react-native-svg"

// Teardrop silhouette: wide and round up top, pinched down to the knot. A plain
// ellipse read as a ball — the pinch is what makes it a balloon. Declared once
// and stacked four times below (flat colour, shadow, sheen, bounce) so every
// layer lines up with the body exactly.
const BODY = `M32 7
    C45.5 7 57 21 57 39
    C57 55 44.5 67.5 35 71.5
    L32 74.5
    L29 71.5
    C19.5 67.5 7 55 7 39
    C7 21 18.5 7 32 7 Z`;

const KNOT = "M29.2 73 L34.8 73 L33.4 79 L30.6 79 Z";

// The balloon shop skin. The colour comes in as a prop, so the shading can't be
// baked in as lighter/darker hues of it — instead the body is filled flat with
// the prop colour and the volume is built on top out of colour-independent
// layers: a white sheen where the light hits, a dark wash on the far side, and a
// bright rim along the lit edge. That keeps it glossy in any colour the shop
// hands it, and it's why the gradient ids can be shared safely across instances:
// every balloon's overlays are identical, only the flat fill underneath differs.
// (Nothing here derives a gradient from `color` for exactly that reason — a
// colour-dependent gradient under a fixed id would leak between two balloons of
// different colours, since react-native-svg resolves url(#id) tree-wide.)
function Ballon(props: any) {
    const color = props.color ?? '#FF4B4B';

    return (
        <Svg
            width={154}
            height={156}
            viewBox="0 0 64 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Defs>
                {/* Light from the upper left. */}
                <RadialGradient id="blnSheen" cx="32%" cy="26%" r="62%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.72}/>
                    <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.16}/>
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
                {/* Shadow gathering on the lower right, so the shape reads round
                    rather than as a flat sticker. */}
                <RadialGradient id="blnShade" cx="76%" cy="80%" r="66%">
                    <Stop offset="0%" stopColor="#000000" stopOpacity={0.42}/>
                    <Stop offset="55%" stopColor="#000000" stopOpacity={0.12}/>
                    <Stop offset="100%" stopColor="#000000" stopOpacity={0}/>
                </RadialGradient>
                {/* Bounced light along the bottom edge — the touch that sells
                    latex over plastic. */}
                <LinearGradient id="blnBounce" x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                    <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0}/>
                </LinearGradient>
                <LinearGradient id="blnKnot" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35}/>
                    <Stop offset="100%" stopColor="#000000" stopOpacity={0.35}/>
                </LinearGradient>
            </Defs>

            {/* Soft coloured halo so the balloon lifts off dark backgrounds. A
                plain low-opacity ellipse, not a gradient — see the note above. */}
            <Ellipse cx={32} cy={40} rx={29} ry={37} fill={color} opacity={0.16}/>

            {/* Body: flat colour, then the three shading layers. */}
            <Path d={BODY} fill={color}/>
            <Path d={BODY} fill="url(#blnShade)"/>
            <Path d={BODY} fill="url(#blnSheen)"/>
            <Path d={BODY} fill="url(#blnBounce)"/>

            {/* Rim light down the lit edge. */}
            <Path
                d="M14 26 C11 33 10.5 43 14 52"
                stroke="#FFFFFF"
                strokeOpacity={0.4}
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
            />

            {/* Specular highlights: one soft, one crisp. */}
            <Ellipse cx={23} cy={25} rx={7} ry={11} fill="#FFFFFF" opacity={0.42} transform="rotate(-18 23 25)"/>
            <Ellipse cx={20.5} cy={20} rx={2.4} ry={3.6} fill="#FFFFFF" opacity={0.85} transform="rotate(-18 20.5 20)"/>

            {/* Knot */}
            <Path d={KNOT} fill={color}/>
            <Path d={KNOT} fill="url(#blnKnot)"/>

            {/* String — a loose curl instead of the old zigzag, so it hangs
                instead of looking like a lightning bolt. */}
            <Path
                d="M32 79
                   C38 83 26.5 86 31 89.5
                   C34.5 92 29 93 32 96"
                stroke="#FFFFFF"
                strokeOpacity={0.75}
                strokeWidth={1.4}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    )
}

export default Ballon
