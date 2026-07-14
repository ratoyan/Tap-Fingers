import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Defs, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The life pickup: a glossy heart wearing a golden ring, with a "+" cut into it
// and sparkles around it. It only falls when the player has already lost a life,
// and tapping it gives that life back — so it is meant to catch the eye.
export function HeartPlus({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="hpGlow" cx="50%" cy="52%" r="50%">
                    <Stop offset="0%" stopColor="#FF5C8A" stopOpacity={0.5}/>
                    <Stop offset="60%" stopColor="#FF2D6F" stopOpacity={0.18}/>
                    <Stop offset="100%" stopColor="#FF2D6F" stopOpacity={0}/>
                </RadialGradient>
                {/* Body: lit from the upper-left, deepening to a wine shadow. */}
                <RadialGradient id="hpBody" cx="34%" cy="26%" r="82%">
                    <Stop offset="0%" stopColor="#FFA7BC"/>
                    <Stop offset="28%" stopColor="#FF5C79"/>
                    <Stop offset="62%" stopColor="#E8123F"/>
                    <Stop offset="100%" stopColor="#8E0022"/>
                </RadialGradient>
                <LinearGradient id="hpRing" x1="0.1" y1="0" x2="0.9" y2="1">
                    <Stop offset="0%" stopColor="#FFF1B8"/>
                    <Stop offset="45%" stopColor="#FFD24A"/>
                    <Stop offset="100%" stopColor="#D28E00"/>
                </LinearGradient>
                <LinearGradient id="hpPlus" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="100%" stopColor="#FFE3EC"/>
                </LinearGradient>
                <RadialGradient id="hpSpark" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>

            {/* soft halo */}
            <Circle cx={50} cy={52} r={47} fill="url(#hpGlow)"/>

            {/* golden ring behind the heart */}
            <G opacity={0.95}>
                <Path
                    d="M50 90 C50 90 9 64 9 38 C9 23 21 12 34 12 C42 12 48 16 50 22 C52 16 58 12 66 12 C79 12 91 23 91 38 C91 64 50 90 50 90 Z"
                    fill="url(#hpRing)"
                />
            </G>

            {/* heart body, inset so the ring reads as a rim */}
            <Path
                d="M50 84 C50 84 15 62 15 39 C15 26 25 17 36 17 C43 17 48 21 50 26 C52 21 57 17 64 17 C75 17 85 26 85 39 C85 62 50 84 50 84 Z"
                fill="url(#hpBody)"
            />

            {/* inner rim light */}
            <Path
                d="M50 84 C50 84 15 62 15 39 C15 26 25 17 36 17 C43 17 48 21 50 26 C52 21 57 17 64 17 C75 17 85 26 85 39 C85 62 50 84 50 84 Z"
                stroke="#FF9DB4"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                fill="none"
            />

            {/* gloss: big soft highlight on the left lobe + a small spot on the right */}
            <Ellipse cx={33} cy={32} rx={11} ry={7.5} fill="#FFFFFF" fillOpacity={0.5} transform="rotate(-32 33 32)"/>
            <Ellipse cx={26} cy={44} rx={4} ry={6} fill="#FFFFFF" fillOpacity={0.2} transform="rotate(-20 26 44)"/>
            <Ellipse cx={68} cy={31} rx={5} ry={3.5} fill="#FFFFFF" fillOpacity={0.28} transform="rotate(-25 68 31)"/>
            {/* bottom bounce light, keeps the tip from going flat */}
            <Path d="M40 70 C45 76 55 76 60 70" stroke="#FF8FA8" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" fill="none"/>

            {/* plus */}
            <G>
                <Path d="M50 32 L50 62 M35 47 L65 47" stroke="#B0002A" strokeOpacity={0.35} strokeWidth={13} strokeLinecap="round"/>
                <Path d="M50 32 L50 62 M35 47 L65 47" stroke="url(#hpPlus)" strokeWidth={9} strokeLinecap="round"/>
            </G>

            {/* sparkles */}
            <Circle cx={84} cy={20} r={7} fill="url(#hpSpark)"/>
            <Path d="M84 14 L85.6 18.6 L90 20 L85.6 21.4 L84 26 L82.4 21.4 L78 20 L82.4 18.6 Z" fill="#FFFFFF"/>
            <Path d="M17 16 L18.2 19.2 L21 20 L18.2 20.8 L17 24 L15.8 20.8 L13 20 L15.8 19.2 Z" fill="#FFF3B0"/>
            <Circle cx={72} cy={74} r={2.4} fill="#FFFFFF" fillOpacity={0.85}/>
            <Circle cx={22} cy={64} r={1.8} fill="#FFFFFF" fillOpacity={0.7}/>
        </Svg>
    );
}

export default HeartPlus;
