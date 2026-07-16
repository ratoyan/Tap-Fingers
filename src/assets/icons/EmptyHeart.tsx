import React from "react";
import Svg, {
    Path,
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    Circle,
} from "react-native-svg";


const EmptyHeart = ({
                        size = 26,
                    }) => (

    <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
    >

        <Defs>


            {/* Red border */}
            <LinearGradient
                id="emptyBorder"
                x1="20"
                y1="10"
                x2="80"
                y2="90"
            >

                <Stop
                    offset="0%"
                    stopColor="#FF8A80"
                />

                <Stop
                    offset="45%"
                    stopColor="#FF1744"
                />

                <Stop
                    offset="100%"
                    stopColor="#8E001C"
                />

            </LinearGradient>



            {/* glow */}
            <RadialGradient
                id="heartGlow"
            >

                <Stop
                    offset="0%"
                    stopColor="#FF1744"
                    stopOpacity="0.25"
                />

                <Stop
                    offset="100%"
                    stopColor="#FF1744"
                    stopOpacity="0"
                />

            </RadialGradient>



            {/* highlight */}
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
                    stopOpacity="0.7"
                />

                <Stop
                    offset="100%"
                    stopColor="#FFFFFF"
                    stopOpacity="0"
                />

            </LinearGradient>


        </Defs>



        {/* glow */}

        <Circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#heartGlow)"
        />



        {/* empty heart outline */}

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

            fill="none"

            stroke="url(#emptyBorder)"

            strokeWidth="8"

            strokeLinejoin="round"
        />



        {/* inner thin border */}

        <Path
            d="
            M50 82
            C44 75 20 59 20 38
            C20 27 28 20 38 20
            C45 20 49 25 50 32
            C51 25 55 20 62 20
            C72 20 80 27 80 38
            C80 59 56 75 50 82
            Z
            "

            fill="none"

            stroke="#FF5252"

            strokeWidth="2"

            opacity="0.35"
        />



        {/* shine */}

        <Path
            d="
            M28 30
            C33 21 43 20 47 28
            C39 29 34 35 32 43
            "
            fill="url(#shine)"
        />


    </Svg>

);


export default EmptyHeart;