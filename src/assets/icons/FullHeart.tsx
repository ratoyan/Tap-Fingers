import React from "react";
import Svg, {
    Path,
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    Circle,
} from "react-native-svg";

const FullHeart = ({
                       size = 26,
                       color = "#FF1744"
                   }) => (

    <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
    >

        <Defs>

            {/* Red heart gradient */}
            <LinearGradient
                id="heartGradient"
                x1="20"
                y1="10"
                x2="80"
                y2="90"
            >

                <Stop
                    offset="0%"
                    stopColor="#FF5252"
                />

                <Stop
                    offset="45%"
                    stopColor={color}
                />

                <Stop
                    offset="100%"
                    stopColor="#B00020"
                />

            </LinearGradient>


            {/* Soft red glow */}
            <RadialGradient
                id="heartGlow"
                cx="50%"
                cy="50%"
                r="50%"
            >

                <Stop
                    offset="0%"
                    stopColor="#FF1744"
                    stopOpacity="0.35"
                />

                <Stop
                    offset="100%"
                    stopColor="#FF1744"
                    stopOpacity="0"
                />

            </RadialGradient>


            {/* Shine */}
            <LinearGradient
                id="shine"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
            >

                <Stop
                    offset="0%"
                    stopColor="#FFFFFF"
                    stopOpacity="0.85"
                />

                <Stop
                    offset="100%"
                    stopColor="#FFFFFF"
                    stopOpacity="0"
                />

            </LinearGradient>


        </Defs>


        {/* Glow */}
        <Circle
            cx="50"
            cy="52"
            r="46"
            fill="url(#heartGlow)"
        />


        {/* Main Heart */}
        <Path
            d="
            M50 88
            C45 81 12 61 12 35
            C12 21 22 12 36 12
            C43 12 49 17 50 25
            C51 17 57 12 64 12
            C78 12 88 21 88 35
            C88 61 55 81 50 88
            Z
            "
            fill="url(#heartGradient)"
        />


        {/* Left reflection */}
        <Path
            d="
            M28 30
            C33 21 43 20 47 28
            C39 29 34 35 32 43
            C27 40 26 34 28 30
            Z
            "
            fill="url(#shine)"
        />


        {/* Small light */}
        <Circle
            cx="68"
            cy="28"
            r="5"
            fill="#FFFFFF"
            opacity="0.35"
        />


    </Svg>

);


export default FullHeart;