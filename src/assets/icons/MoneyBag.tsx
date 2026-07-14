import * as React from 'react';
import Svg, {Circle, Ellipse, G, Path, Text as SvgText, Defs, LinearGradient, RadialGradient, Stop} from 'react-native-svg';

// The bonus drop (former "golden" box): a cinched sack of coins. Tapping it does
// exactly what tapping a golden card did — same handler, same 3 points — it just
// looks like loot instead of a glowing card.
export function MoneyBag({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="mbGlow" cx="50%" cy="60%" r="50%">
                    <Stop offset="0%" stopColor="#FFD54F" stopOpacity={0.4}/>
                    <Stop offset="100%" stopColor="#FFD54F" stopOpacity={0}/>
                </RadialGradient>
                <LinearGradient id="mbSack" x1="0.2" y1="0" x2="0.85" y2="1">
                    <Stop offset="0%" stopColor="#C68A3E"/>
                    <Stop offset="45%" stopColor="#9C6B2F"/>
                    <Stop offset="100%" stopColor="#6B4620"/>
                </LinearGradient>
                <LinearGradient id="mbNeck" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#E0B070"/>
                    <Stop offset="100%" stopColor="#A87840"/>
                </LinearGradient>
                <LinearGradient id="mbCoin" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF3B0"/>
                    <Stop offset="55%" stopColor="#FFD230"/>
                    <Stop offset="100%" stopColor="#E39B00"/>
                </LinearGradient>
            </Defs>

            {/* warm halo */}
            <Circle cx={50} cy={62} r={46} fill="url(#mbGlow)"/>

            {/* body */}
            <Path
                d="M38 32 C22 44 12 62 20 78 C26 90 40 94 50 94 C60 94 74 90 80 78 C88 62 78 44 62 32 Z"
                fill="url(#mbSack)"
                stroke="#4E320F"
                strokeWidth={2}
            />
            {/* fold shading */}
            <Path d="M34 46 C28 58 27 72 33 86" stroke="#7A5326" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.7}/>
            <Path d="M67 47 C73 58 74 72 68 86" stroke="#7A5326" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.5}/>
            <Ellipse cx={40} cy={58} rx={8} ry={5} fill="#FFFFFF" fillOpacity={0.14} transform="rotate(-20 40 58)"/>

            {/* tie + ruffled neck */}
            <Path
                d="M36 32 C40 24 60 24 64 32 C58 30 42 30 36 32 Z"
                fill="url(#mbNeck)"
                stroke="#4E320F"
                strokeWidth={1.5}
            />
            <Path d="M33 33 C42 28 58 28 67 33" stroke="#F2C879" strokeWidth={4} strokeLinecap="round" fill="none"/>
            <Path d="M28 22 L38 30 M72 22 L62 30" stroke="#C79A57" strokeWidth={3} strokeLinecap="round"/>

            {/* coin emblem */}
            <Circle cx={50} cy={64} r={16} fill="url(#mbCoin)" stroke="#B37700" strokeWidth={2}/>
            <SvgText
                x={50}
                y={71}
                textAnchor="middle"
                fontSize={20}
                fontWeight="bold"
                fill="#8A5A00"
            >
                $
            </SvgText>

            {/* spilling coins */}
            <G>
                <Circle cx={24} cy={26} r={6} fill="url(#mbCoin)" stroke="#B37700" strokeWidth={1.5}/>
                <Circle cx={78} cy={20} r={4.5} fill="url(#mbCoin)" stroke="#B37700" strokeWidth={1.5}/>
            </G>
        </Svg>
    );
}

// The burst left behind after the bag is tapped.
export function CoinBurst({size = 100}: {size?: number}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <RadialGradient id="cbCore" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF"/>
                    <Stop offset="40%" stopColor="#FFE27A"/>
                    <Stop offset="100%" stopColor="#FFB300" stopOpacity={0.1}/>
                </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={34} fill="url(#cbCore)"/>
            <G fill="#FFD230" stroke="#B37700" strokeWidth={1.5}>
                <Circle cx={22} cy={30} r={7}/>
                <Circle cx={78} cy={34} r={6}/>
                <Circle cx={30} cy={76} r={6}/>
                <Circle cx={72} cy={72} r={7}/>
                <Circle cx={50} cy={18} r={5}/>
            </G>
        </Svg>
    );
}

export default MoneyBag;
