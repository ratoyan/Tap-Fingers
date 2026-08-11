import * as React from "react"
import Svg, {
    Defs,
    LinearGradient,
    Stop,
    RadialGradient,
    Rect,
    Path,
    G,
    Circle,
    Text
} from "react-native-svg"

function Card1(props: any) {
    return (
        <Svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
            <Defs>
                <LinearGradient id="a" x1={0} y1={0} x2={1} y2={1}>
                    <Stop offset="0%" stopColor="#1b1247" />
                    <Stop offset="45%" stopColor="#2d1b69" />
                    <Stop offset="100%" stopColor="#0c0a26" />
                </LinearGradient>
                <RadialGradient id="b" cx="50%" cy="30%" r="75%">
                    <Stop offset="0%" stopColor="#7b5cff" stopOpacity={0.55} />
                    <Stop offset="65%" stopColor="#7b5cff" stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id="d" x1={0} y1={0} x2={1} y2={1}>
                    <Stop offset="0%" stopColor="#00f5ff" />
                    <Stop offset="50%" stopColor="#a64bff" />
                    <Stop offset="100%" stopColor="#ff2bd6" />
                </LinearGradient>
                <LinearGradient id="c" x1={0} y1={0} x2={0} y2={1}>
                    <Stop offset="0%" stopColor="#fff" stopOpacity={0.32} />
                    <Stop offset="100%" stopColor="#fff" stopOpacity={0} />
                </LinearGradient>
                <LinearGradient id="e" x1={0} y1={0} x2={0} y2={1}>
                    <Stop offset="0%" stopColor="#fff" />
                    <Stop offset="100%" stopColor="#9fc0ff" />
                </LinearGradient>
            </Defs>
            <Rect x={3} y={3} width={94} height={94} rx={16} fill="url(#a)" />
            <Rect x={3} y={3} width={94} height={94} rx={16} fill="url(#b)" />
            <Path d="M3 19Q3 3 19 3h62q16 0 16 16v18Q50 51 3 37z" fill="url(#c)" />
            <Rect
                x={3}
                y={3}
                width={94}
                height={94}
                rx={16}
                fill="none"
                stroke="url(#d)"
                strokeWidth={6}
                opacity={0.22}
            />
            <Rect
                x={5.5}
                y={5.5}
                width={89}
                height={89}
                rx={13}
                fill="none"
                stroke="url(#d)"
                strokeWidth={2.5}
            />
            <G fill="#fff">
                <Path
                    d="M24 21l1.7 4.3L30 27l-4.3 1.7L24 33l-1.7-4.3L18 27l4.3-1.7z"
                    opacity={0.9}
                />
                <Circle cx={77} cy={75} r={1.7} opacity={0.75} />
                <Circle cx={79} cy={27} r={1.2} opacity={0.6} />
                <Circle cx={21} cy={68} r={1.1} opacity={0.5} />
            </G>
            <Text
                x={50}
                y={63}
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
                fontSize={38}
                fontWeight={800}
                fill="url(#e)"
            >
                {"TF"}
            </Text>
        </Svg>
    )
}

export default Card1;
