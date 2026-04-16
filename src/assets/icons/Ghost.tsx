import React from 'react';
import Svg, {Path, Ellipse, Circle} from 'react-native-svg';

interface GhostProps {
    size?: number;
    color?: string;
    eyeColor?: string;
}

export default function Ghost({size = 90, color = 'white', eyeColor = '#4B0082'}: GhostProps) {
    const w = size;
    const h = size * 1.25;

    return (
        <Svg width={w} height={h} viewBox="0 0 100 125">
            {/* Body */}
            <Path
                d="M15 58 C15 26 30 6 50 6 C70 6 85 26 85 58 L85 105 Q78 95 70 105 Q62 115 55 105 Q50 98 50 105 Q44 115 35 105 Q27 95 20 105 Z"
                fill={color}
                opacity={0.93}
            />
            {/* Left eye */}
            <Ellipse cx="37" cy="50" rx="9" ry="10" fill={eyeColor} />
            <Circle cx="40" cy="46" r="3.5" fill="white" />
            {/* Right eye */}
            <Ellipse cx="63" cy="50" rx="9" ry="10" fill={eyeColor} />
            <Circle cx="66" cy="46" r="3.5" fill="white" />
            {/* Smile */}
            <Path
                d="M40 68 Q50 77 60 68"
                stroke={eyeColor}
                strokeWidth="2.8"
                fill="none"
                strokeLinecap="round"
            />
        </Svg>
    );
}
