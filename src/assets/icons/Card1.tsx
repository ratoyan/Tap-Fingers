import * as React from "react"
import Svg, {
    Rect,
    Image,
    Text,
    Defs,
    LinearGradient,
    Stop
} from "react-native-svg"

function Card1(props: any) {
    return (
        <Svg
            width={260}
            height={360}
            viewBox="0 0 260 360"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Rect width={260} height={360} rx={20} fill="#0f0f1a" />
            <Rect
                x={6}
                y={6}
                width={248}
                height={348}
                rx={16}
                fill="none"
                stroke="url(#neon)"
                strokeWidth={3}
            />
            <Image
                href="character.png"
                x={30}
                y={40}
                width={200}
                height={160}
                preserveAspectRatio="xMidYMid slice"
            />
            <Text x={130} y={240} textAnchor="middle" fill="#fff" fontSize={20}>
                {"Tap Fingers"}
            </Text>
            <Defs>
                <LinearGradient id="neon">
                    <Stop offset="0%" stopColor="#00f5ff" />
                    <Stop offset="100%" stopColor="#f0f" />
                </LinearGradient>
            </Defs>
        </Svg>
    )
}

export default Card1;
