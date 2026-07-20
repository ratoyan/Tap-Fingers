import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Rect, Defs, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The falling mine barrel — the second hazard alongside FallingBomb. It has to
// read as "dangerous" at a glance while staying instantly distinguishable from
// the bomb: where the bomb is a small round black shell with a fuse, the barrel
// is a wide rusty drum with yellow/black hazard stripes and a red mine trigger
// on the lid. Tapping it costs a heart; letting it fall past the edge is free.
//
// Every gradient id is prefixed `mb` — react-native-svg resolves url(#id)
// references across the whole tree, so a clash with FallingBomb's `fb*` ids
// would silently repaint one of the two.
// The barrel renders larger than the card size it inherits — a heavier hazard
// should look heavier. Shared with Play's spawner so a barrel spawned at the far
// right still fits on screen.
export const BARREL_ART_SCALE = 1.22;

export function MineBarrel({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="mbGlow" cx="50%" cy="58%" r="52%">
                    <Stop offset="0%" stopColor="#FFC400" stopOpacity={0.38}/>
                    <Stop offset="100%" stopColor="#FF6D00" stopOpacity={0}/>
                </RadialGradient>
                {/* Left-lit metal: bright edge on the left, deep shadow right, so
                    the flat drum body reads as a cylinder. */}
                <LinearGradient id="mbBody" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#2E3A20"/>
                    <Stop offset="22%" stopColor="#6E7F4A"/>
                    <Stop offset="52%" stopColor="#4A5A31"/>
                    <Stop offset="80%" stopColor="#28321C"/>
                    <Stop offset="100%" stopColor="#161C10"/>
                </LinearGradient>
                <LinearGradient id="mbBand" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#8D6E3A"/>
                    <Stop offset="30%" stopColor="#C8A24C"/>
                    <Stop offset="70%" stopColor="#6B5327"/>
                    <Stop offset="100%" stopColor="#3E2F16"/>
                </LinearGradient>
                <LinearGradient id="mbLid" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#7E8F58"/>
                    <Stop offset="100%" stopColor="#333F22"/>
                </LinearGradient>
                <RadialGradient id="mbTrigger" cx="38%" cy="32%" r="70%">
                    <Stop offset="0%" stopColor="#FF8A80"/>
                    <Stop offset="45%" stopColor="#F4341F"/>
                    <Stop offset="100%" stopColor="#8E0000"/>
                </RadialGradient>
            </Defs>

            {/* danger halo */}
            <Ellipse cx={50} cy={56} rx={46} ry={42} fill="url(#mbGlow)"/>

            {/* drum body */}
            <Path
                d="M24 30 H76 V78 A26 9 0 0 1 24 78 Z"
                fill="url(#mbBody)"
            />
            {/* lid ellipse */}
            <Ellipse cx={50} cy={30} rx={26} ry={9} fill="url(#mbLid)"/>
            <Ellipse cx={50} cy={30} rx={26} ry={9} fill="none" stroke="#141A0D" strokeWidth={1.5}/>

            {/* hazard stripes: clipped to the body by drawing them as short bars
                inside the drum silhouette rather than a full-width band */}
            <G opacity={0.92}>
                <Rect x={26} y={45} width={48} height={11} fill="#FFC400"/>
                <Path d="M30 45 L38 45 L30 56 L26 56 Z" fill="#1A1A1A"/>
                <Path d="M46 45 L54 45 L46 56 L38 56 Z" fill="#1A1A1A"/>
                <Path d="M62 45 L70 45 L62 56 L54 56 Z" fill="#1A1A1A"/>
                <Path d="M74 45 L74 45 L74 56 L70 56 Z" fill="#1A1A1A"/>
            </G>

            {/* rolling hoops */}
            <Rect x={24} y={38} width={52} height={4} fill="url(#mbBand)"/>
            <Rect x={24} y={62} width={52} height={4} fill="url(#mbBand)"/>

            {/* body sheen + rust speckles */}
            <Path d="M31 32 Q28 55 31 79" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" fill="none"/>
            <Circle cx={66} cy={70} r={2.4} fill="#8D4A22" fillOpacity={0.55}/>
            <Circle cx={61} cy={36} r={1.8} fill="#8D4A22" fillOpacity={0.45}/>

            {/* mine trigger on the lid: horns + a red pressure cap */}
            <G stroke="#20260F" strokeWidth={2} strokeLinecap="round">
                <Path d="M39 25 L35 17"/>
                <Path d="M61 25 L65 17"/>
            </G>
            <Circle cx={35} cy={16} r={3} fill="#B0BEC5"/>
            <Circle cx={65} cy={16} r={3} fill="#B0BEC5"/>
            <Circle cx={50} cy={24} r={9} fill="url(#mbTrigger)"/>
            <Circle cx={50} cy={24} r={9} fill="none" stroke="#4A0D06" strokeWidth={1.5}/>
            <Circle cx={47} cy={21} r={2.6} fill="#FFFFFF" fillOpacity={0.65}/>
        </Svg>
    );
}

// The blast left behind after a mine barrel is tapped: a shrapnel burst with
// torn drum staves flying out, so it reads as "the barrel came apart" rather
// than repeating the bomb's fireball.
export function BarrelBlast({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
            <Defs>
                <RadialGradient id="mbBlastGlow">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="30%" stopColor="#FFE082"/>
                    <Stop offset="62%" stopColor="#FF8F00"/>
                    <Stop offset="100%" stopColor="#5D2C00" stopOpacity="0"/>
                </RadialGradient>
                <RadialGradient id="mbBlastCore">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="35%" stopColor="#FFF59D"/>
                    <Stop offset="70%" stopColor="#FB8C00"/>
                    <Stop offset="100%" stopColor="#BF360C"/>
                </RadialGradient>
                <LinearGradient id="mbStave" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#8A9A5B"/>
                    <Stop offset="100%" stopColor="#232C15"/>
                </LinearGradient>
            </Defs>

            <Circle cx="60" cy="60" r="58" fill="url(#mbBlastGlow)" opacity="0.7"/>

            {/* fireball */}
            <Path
                fill="url(#mbBlastCore)"
                d="M60 12 L70 34 L92 22 L84 46 L112 52 L86 62 L104 84 L78 78 L82 106 L60 88 L38 106 L42 78 L16 84 L34 62 L8 52 L36 46 L28 22 L50 34 Z"
            />
            <Circle cx="60" cy="60" r="17" fill="#FFF8E1"/>
            <Circle cx="60" cy="60" r="9" fill="#FFFFFF"/>

            {/* torn drum staves thrown clear of the blast */}
            <G fill="url(#mbStave)">
                <Path d="M14 24 L28 16 L34 27 L20 35 Z"/>
                <Path d="M96 22 L108 32 L98 42 L88 32 Z"/>
                <Path d="M18 92 L31 86 L36 97 L23 103 Z"/>
                <Path d="M94 88 L106 94 L99 105 L88 99 Z"/>
            </G>

            {/* hazard-yellow shrapnel */}
            <G fill="#FFC400">
                <Path d="M62 4 L67 14 L58 14 Z"/>
                <Path d="M4 62 L14 57 L14 66 Z"/>
                <Path d="M112 66 L104 60 L113 55 Z"/>
                <Path d="M58 116 L54 106 L64 107 Z"/>
            </G>
        </Svg>
    );
}

export default MineBarrel;
