import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Defs, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The falling hazard bomb: a glossy black shell with a lit fuse. Tapping it
// costs a heart, so it reads as danger — warm glow behind the shell, spark on
// the fuse, and a red rim that separates it from the harmless cards.
export function FallingBomb({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="fbGlow" cx="50%" cy="60%" r="50%">
                    <Stop offset="0%" stopColor="#FF3B30" stopOpacity={0.45}/>
                    <Stop offset="100%" stopColor="#FF3B30" stopOpacity={0}/>
                </RadialGradient>
                <RadialGradient id="fbShell" cx="35%" cy="30%" r="75%">
                    <Stop offset="0%" stopColor="#6E6E76"/>
                    <Stop offset="55%" stopColor="#2B2B31"/>
                    <Stop offset="100%" stopColor="#0D0D10"/>
                </RadialGradient>
                <RadialGradient id="fbSpark" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="45%" stopColor="#FFD54F"/>
                    <Stop offset="100%" stopColor="#FF6D00" stopOpacity={0}/>
                </RadialGradient>
                <LinearGradient id="fbFuse" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#8D6E63"/>
                    <Stop offset="100%" stopColor="#D7A86E"/>
                </LinearGradient>
            </Defs>

            {/* danger halo */}
            <Circle cx={48} cy={62} r={44} fill="url(#fbGlow)"/>

            {/* shell */}
            <Circle cx={48} cy={62} r={31} fill="url(#fbShell)"/>
            <Circle cx={48} cy={62} r={31} stroke="#FF3B30" strokeWidth={2} strokeOpacity={0.55} fill="none"/>

            {/* highlights */}
            <Ellipse cx={37} cy={50} rx={9} ry={6} fill="#FFFFFF" fillOpacity={0.22} transform="rotate(-25 37 50)"/>
            <Circle cx={60} cy={76} r={4} fill="#FFFFFF" fillOpacity={0.08}/>

            {/* cap + fuse */}
            <Path d="M42 36 L54 36 L57 27 L39 27 Z" fill="#3E3E46" stroke="#15151A" strokeWidth={1.5}/>
            <Path
                d="M50 27 C50 18 60 20 62 13 C63.5 8.5 69 8 71 11"
                stroke="url(#fbFuse)"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />

            {/* spark */}
            <Circle cx={73} cy={10} r={11} fill="url(#fbSpark)"/>
            <G stroke="#FFE082" strokeWidth={2} strokeLinecap="round">
                <Path d="M73 1 L73 -3"/>
                <Path d="M82 10 L86 10"/>
                <Path d="M80 3 L83 0"/>
            </G>
            <Circle cx={73} cy={10} r={3.5} fill="#FFFFFF"/>
        </Svg>
    );
}

// The blast left behind after a bomb is tapped.
export function BombBlast({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
            <Defs>

                <RadialGradient id="blastGlow">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="25%" stopColor="#FFF8DC"/>
                    <Stop offset="55%" stopColor="#FFC107"/>
                    <Stop offset="80%" stopColor="#FF5722"/>
                    <Stop offset="100%" stopColor="#B71C1C" stopOpacity="0"/>
                </RadialGradient>


                <RadialGradient id="hotFire">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="15%" stopColor="#FFFFCC"/>
                    <Stop offset="40%" stopColor="#FFD740"/>
                    <Stop offset="65%" stopColor="#FF9800"/>
                    <Stop offset="90%" stopColor="#F4511E"/>
                    <Stop offset="100%" stopColor="#8E0000"/>
                </RadialGradient>


                <LinearGradient id="flameEdge" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF176"/>
                    <Stop offset="40%" stopColor="#FFB300"/>
                    <Stop offset="100%" stopColor="#E53935"/>
                </LinearGradient>

            </Defs>


            {/* Big explosion glow */}
            <Circle
                cx="60"
                cy="60"
                r="58"
                fill="url(#blastGlow)"
                opacity="0.65"
            />


            {/* Outer fire spikes */}
            <Path
                fill="url(#hotFire)"
                d="
    M60 3
    L66 25
    L82 8
    L78 32
    L105 20
    L90 45
    L118 48
    L94 60
    L116 75
    L88 72
    L102 102
    L76 84
    L68 117
    L55 90
    L38 115
    L40 85
    L12 103
    L28 72
    L3 78
    L24 57
    L4 40
    L34 42
    L18 15
    L45 30
    Z
    "
            />


            {/* Inner flame */}
            <Path
                fill="url(#flameEdge)"
                d="
    M60 20
    C70 35 85 35 88 48
    C76 52 84 66 90 70
    C75 70 72 84 65 95
    C55 82 44 88 34 95
    C40 78 25 70 18 64
    C35 60 32 45 27 38
    C44 42 54 30 60 20
    Z
    "
            />


            {/* White hot center */}
            <Circle
                cx="60"
                cy="60"
                r="20"
                fill="#FFFDE7"
            />

            <Circle
                cx="60"
                cy="60"
                r="11"
                fill="#FFFFFF"
            />


            {/* Sparks */}
            <Path
                fill="#FFD54F"
                d="M15 30 L18 22 L22 30 L18 36 Z"
            />

            <Path
                fill="#FF9800"
                d="M98 38 L102 28 L107 38 L102 44 Z"
            />

            <Path
                fill="#FFF176"
                d="M105 85 L109 76 L113 85 L109 91 Z"
            />

        </Svg>
    );
}

export default FallingBomb;
