import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Rect, Defs, ClipPath, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The mystery gift box: a glossy violet present cinched with a golden ribbon and
// a full bow, lit from the upper-left, ringed by a violet glow and sparkles. The
// gold "?" across the front is what marks it as the gamble it is — tapping it
// either pays out coins or booms — without spelling either outcome out.
export function GiftBox({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="ggGlow" cx="50%" cy="52%" r="52%">
                    <Stop offset="0%" stopColor="#EE7BFF" stopOpacity={0.5}/>
                    <Stop offset="58%" stopColor="#B23BE0" stopOpacity={0.18}/>
                    <Stop offset="100%" stopColor="#B23BE0" stopOpacity={0}/>
                </RadialGradient>

                {/* Box face, lit from the upper-left and deepening into a violet
                    shadow on the lower-right. */}
                <LinearGradient id="ggFace" x1="0.1" y1="0" x2="0.9" y2="1">
                    <Stop offset="0%" stopColor="#E08BFF"/>
                    <Stop offset="45%" stopColor="#A230C9"/>
                    <Stop offset="100%" stopColor="#4E1173"/>
                </LinearGradient>
                <LinearGradient id="ggLid" x1="0.1" y1="0" x2="0.9" y2="1">
                    <Stop offset="0%" stopColor="#F5A6FF"/>
                    <Stop offset="52%" stopColor="#BB43E4"/>
                    <Stop offset="100%" stopColor="#6C1B96"/>
                </LinearGradient>
                {/* Vertical shading over the face: light along the top edge,
                    deepening into shadow at the bottom — what gives the flat
                    rectangle its weight. */}
                <LinearGradient id="ggShade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22}/>
                    <Stop offset="42%" stopColor="#FFFFFF" stopOpacity={0}/>
                    <Stop offset="100%" stopColor="#1E0430" stopOpacity={0.4}/>
                </LinearGradient>

                <LinearGradient id="ggRibbon" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFFBE3"/>
                    <Stop offset="40%" stopColor="#FFD24A"/>
                    <Stop offset="100%" stopColor="#C87A00"/>
                </LinearGradient>
                {/* The "?" — gold rather than flat white, so it sits with the
                    ribbon instead of punching a hole in the artwork. */}
                <LinearGradient id="ggQ" x1="0.2" y1="0" x2="0.8" y2="1">
                    <Stop offset="0%" stopColor="#FFFDF0"/>
                    <Stop offset="45%" stopColor="#FFE27A"/>
                    <Stop offset="100%" stopColor="#FFB300"/>
                </LinearGradient>

                <ClipPath id="ggBoxClip">
                    <Rect x={18} y={51} width={64} height={43} rx={7}/>
                </ClipPath>
                <ClipPath id="ggLidClip">
                    <Rect x={12} y={40} width={76} height={17} rx={6}/>
                </ClipPath>
            </Defs>

            {/* violet halo */}
            <Circle cx={50} cy={54} r={48} fill="url(#ggGlow)"/>

            {/* ground shadow — plants the box instead of leaving it floating */}
            <Ellipse cx={50} cy={96} rx={30} ry={3.8} fill="#120020" fillOpacity={0.3}/>

            {/* ── Box front — the deeper body under the lid ── */}
            <G clipPath="url(#ggBoxClip)">
                <Rect x={18} y={51} width={64} height={43} fill="url(#ggFace)"/>
                <Rect x={18} y={51} width={64} height={43} fill="url(#ggShade)"/>
                {/* specular sweep across the upper-left, gloss, and a soft light
                    bounce along the bottom edge */}
                <Path d="M21 51 L41 51 L24 95 L18 95 Z" fill="#FFFFFF" fillOpacity={0.12}/>
                <Ellipse cx={34} cy={61} rx={9} ry={4.6} fill="#FFFFFF" fillOpacity={0.18} transform="rotate(-18 34 61)"/>
                <Path d="M24 89 C35 93 65 93 76 89" stroke="#E79CFF" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" fill="none"/>
            </G>
            <Rect x={18} y={51} width={64} height={43} rx={7} fill="none" stroke="#340B4E" strokeWidth={2.2}/>

            {/* ── Lid, overhanging the body on both sides ── */}
            <G clipPath="url(#ggLidClip)">
                <Rect x={12} y={40} width={76} height={17} fill="url(#ggLid)"/>
                <Rect x={16} y={42.5} width={68} height={3.4} rx={1.7} fill="#FFFFFF" fillOpacity={0.3}/>
                <Rect x={12} y={53.5} width={76} height={3.5} fill="#1E0430" fillOpacity={0.22}/>
            </G>
            <Rect x={12} y={40} width={76} height={17} rx={6} fill="none" stroke="#340B4E" strokeWidth={2.2}/>

            {/* ── Gold ribbon running up the lid ── */}
            <Rect x={43} y={40} width={14} height={17} fill="url(#ggRibbon)" stroke="#B37700" strokeWidth={1}/>
            <Rect x={45.5} y={40} width={3} height={17} fill="#FFFFFF" fillOpacity={0.32}/>
            <Rect x={53.5} y={40} width={2.5} height={17} fill="#9A6A00" fillOpacity={0.28}/>

            {/* ── Bow: two loops, a knot and their highlights ── */}
            <G stroke="#B37700" strokeWidth={1.5}>
                <Path d="M50 40 C45 27 32 27 33.5 35.5 C35 42.5 45 43.5 50 40 Z" fill="url(#ggRibbon)"/>
                <Path d="M50 40 C55 27 68 27 66.5 35.5 C65 42.5 55 43.5 50 40 Z" fill="url(#ggRibbon)"/>
            </G>
            <Path d="M45.5 35 C41 29.5 35.5 30 34.5 34" stroke="#FFF6D0" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85}/>
            <Path d="M54.5 35 C59 29.5 64.5 30 65.5 34" stroke="#FFF6D0" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.85}/>
            <Path d="M46 41.5 C41.5 42.5 36.5 42 34.5 39.5" stroke="#A56E00" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.5}/>
            <Path d="M54 41.5 C58.5 42.5 63.5 42 65.5 39.5" stroke="#A56E00" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.5}/>
            {/* knot */}
            <Rect x={43.5} y={34} width={13} height={13} rx={4.5} fill="url(#ggRibbon)" stroke="#B37700" strokeWidth={1.6}/>
            <Ellipse cx={47.5} cy={38} rx={2.4} ry={1.9} fill="#FFFFFF" fillOpacity={0.65}/>

            {/* ── The "?" across the front: the mystery, in gold on violet ── */}
            <G fill="none" strokeLinecap="round">
                <Path d="M42.5 68.5 C42.5 61 57.5 60.5 57.5 68 C57.5 72.8 50 73.3 50 78" stroke="#340B4E" strokeWidth={10.5}/>
                <Path d="M42.5 68.5 C42.5 61 57.5 60.5 57.5 68 C57.5 72.8 50 73.3 50 78" stroke="url(#ggQ)" strokeWidth={6}/>
                <Path d="M44.2 67 C45 62.8 52 62 55.2 63.9" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.7}/>
            </G>
            <Circle cx={50} cy={84.5} r={5.6} fill="#340B4E"/>
            <Circle cx={50} cy={84.5} r={3.1} fill="url(#ggQ)"/>

            {/* sparkles */}
            <Path d="M86 22 L87.8 27 L92 28 L87.8 29 L86 34 L84.2 29 L80 28 L84.2 27 Z" fill="#FFFFFF"/>
            <Path d="M13 44 L14.2 47.4 L17 48 L14.2 48.6 L13 52 L11.8 48.6 L9 48 L11.8 47.4 Z" fill="#FFF3B0"/>
            <Circle cx={86} cy={64} r={1.9} fill="#FFFFFF" fillOpacity={0.8}/>
            <Circle cx={15} cy={70} r={1.5} fill="#FFFFFF" fillOpacity={0.65}/>
        </Svg>
    );
}

export default GiftBox;
