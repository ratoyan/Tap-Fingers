import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Rect, Defs, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The mystery gift box: a glossy violet present cinched with a golden ribbon, a
// full bow and two hanging tails, lit from the upper-left and ringed by a violet
// glow and sparkles. Tapping it is a gamble — it either pays out coins or booms —
// so it's dressed to tempt the eye.
export function GiftBox({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="gbGlow" cx="50%" cy="54%" r="52%">
                    <Stop offset="0%" stopColor="#EE7BFF" stopOpacity={0.5}/>
                    <Stop offset="55%" stopColor="#B23BE0" stopOpacity={0.18}/>
                    <Stop offset="100%" stopColor="#B23BE0" stopOpacity={0}/>
                </RadialGradient>
                {/* Box front: lit from the upper-left, deepening to a violet shadow. */}
                <LinearGradient id="gbBox" x1="0.12" y1="0" x2="0.9" y2="1">
                    <Stop offset="0%" stopColor="#D264EE"/>
                    <Stop offset="48%" stopColor="#A230C9"/>
                    <Stop offset="100%" stopColor="#5E1687"/>
                </LinearGradient>
                <LinearGradient id="gbLid" x1="0.1" y1="0" x2="0.9" y2="1">
                    <Stop offset="0%" stopColor="#EC85FF"/>
                    <Stop offset="55%" stopColor="#BB43E4"/>
                    <Stop offset="100%" stopColor="#7A1FA8"/>
                </LinearGradient>
                <LinearGradient id="gbRibbon" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF7CE"/>
                    <Stop offset="42%" stopColor="#FFD24A"/>
                    <Stop offset="100%" stopColor="#DD8C00"/>
                </LinearGradient>
                <LinearGradient id="gbBow" x1="0.2" y1="0" x2="0.8" y2="1">
                    <Stop offset="0%" stopColor="#FFF4BE"/>
                    <Stop offset="50%" stopColor="#FFCE3C"/>
                    <Stop offset="100%" stopColor="#CE8200"/>
                </LinearGradient>
                <RadialGradient id="gbSpark" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>

            {/* soft halo */}
            <Circle cx={50} cy={54} r={48} fill="url(#gbGlow)"/>

            {/* box front */}
            <Rect x={20} y={50} width={60} height={37} rx={5} fill="url(#gbBox)" stroke="#3B0D58" strokeWidth={2}/>
            {/* left-face gloss + soft bottom bounce so the box reads as 3D */}
            <Ellipse cx={33} cy={60} rx={8} ry={5} fill="#FFFFFF" fillOpacity={0.16} transform="rotate(-18 33 60)"/>
            <Path d="M26 82 C36 86 64 86 74 82" stroke="#E79CFF" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" fill="none"/>

            {/* ribbon tails hanging from the knot onto the box front */}
            <G fill="url(#gbRibbon)" stroke="#B37700" strokeWidth={1}>
                <Path d="M47 40 L36 62 L44 60 L50 44 Z"/>
                <Path d="M53 40 L64 62 L56 60 L50 44 Z"/>
            </G>

            {/* lid, overhanging the body a touch on each side */}
            <Rect x={14} y={37} width={72} height={16} rx={5} fill="url(#gbLid)" stroke="#3B0D58" strokeWidth={2}/>
            <Rect x={18} y={40} width={64} height={3.5} rx={1.75} fill="#FFFFFF" fillOpacity={0.22}/>

            {/* vertical ribbon (down the front, up the lid) */}
            <Rect x={43} y={50} width={14} height={37} fill="url(#gbRibbon)" stroke="#B37700" strokeWidth={1}/>
            <Rect x={43} y={37} width={14} height={16} fill="url(#gbRibbon)" stroke="#B37700" strokeWidth={1}/>
            {/* ribbon highlight + shadow edge */}
            <Rect x={45.5} y={37} width={3} height={50} fill="#FFFFFF" fillOpacity={0.32}/>
            <Rect x={53.5} y={50} width={2.5} height={37} fill="#9A6A00" fillOpacity={0.3}/>

            {/* bow: two full loops + a centre knot */}
            <G stroke="#B37700" strokeWidth={1.5}>
                <Path d="M50 33 C42 19 22 18 24 30 C25 39 42 39 50 33 Z" fill="url(#gbBow)"/>
                <Path d="M50 33 C58 19 78 18 76 30 C75 39 58 39 50 33 Z" fill="url(#gbBow)"/>
            </G>
            {/* loop inner curves (catch the light along the top of each loop) */}
            <Path d="M45 31 C38 25 29 26 27 30" stroke="#FFF0B0" strokeWidth={1.6} fill="none" opacity={0.75} strokeLinecap="round"/>
            <Path d="M55 31 C62 25 71 26 73 30" stroke="#FFF0B0" strokeWidth={1.6} fill="none" opacity={0.75} strokeLinecap="round"/>
            {/* loop underside shadow */}
            <Path d="M46 35 C40 37 32 37 28 34" stroke="#A56E00" strokeWidth={1.4} fill="none" opacity={0.5} strokeLinecap="round"/>
            <Path d="M54 35 C60 37 68 37 72 34" stroke="#A56E00" strokeWidth={1.4} fill="none" opacity={0.5} strokeLinecap="round"/>

            {/* knot */}
            <Rect x={43} y={27} width={14} height={13} rx={4.5} fill="url(#gbRibbon)" stroke="#B37700" strokeWidth={1.5}/>
            <Ellipse cx={47} cy={31} rx={2.6} ry={2} fill="#FFFFFF" fillOpacity={0.55}/>

            {/* sparkles */}
            <Circle cx={83} cy={26} r={6} fill="url(#gbSpark)"/>
            <Path d="M83 20 L84.7 24.9 L89 26 L84.7 27.1 L83 32 L81.3 27.1 L77 26 L81.3 24.9 Z" fill="#FFFFFF"/>
            <Path d="M15 41 L16.2 44.4 L19 45 L16.2 45.6 L15 49 L13.8 45.6 L11 45 L13.8 44.4 Z" fill="#FFF3B0"/>
            <Circle cx={82} cy={62} r={2} fill="#FFFFFF" fillOpacity={0.8}/>
            <Circle cx={20} cy={72} r={1.6} fill="#FFFFFF" fillOpacity={0.7}/>
        </Svg>
    );
}

export default GiftBox;
