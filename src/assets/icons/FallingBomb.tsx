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
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="bbCore" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="35%" stopColor="#FFD54F"/>
                    <Stop offset="70%" stopColor="#FF5722"/>
                    <Stop offset="100%" stopColor="#B71C1C" stopOpacity={0.15}/>
                </RadialGradient>
            </Defs>
            <Path
                d="M50 6 L60 30 L84 18 L72 42 L96 50 L72 58 L84 82 L60 70 L50 94 L40 70 L16 82 L28 58 L4 50 L28 42 L16 18 L40 30 Z"
                fill="url(#bbCore)"
            />
            <Circle cx={50} cy={50} r={17} fill="#FFF3E0" fillOpacity={0.9}/>
        </Svg>
    );
}

export default FallingBomb;
