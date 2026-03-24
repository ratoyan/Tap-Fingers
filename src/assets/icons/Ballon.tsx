import * as React from "react"
import Svg, {Ellipse, Path} from "react-native-svg"

function Ballon(props: any) {
    return (
        <Svg
            width={154}
            height={156}
            viewBox="0 0 64 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Ellipse
                cx={32}
                cy={40}
                rx={24}
                ry={32}
                fill={props.color ?? '#FF4B4B'}
                stroke={props.color ?? '#FF4B4B'}
                strokeWidth={2}
            />
            <Ellipse cx={24} cy={28} rx={6} ry={10} fill="#fff" opacity={0.4}/>
            <Path
                stroke="#fff"
                strokeWidth={1}
                d="
                    M32 72
                    L30 76
                    L34 80
                    L30 84
                    L34 88
                    L32 96
                  "
            />
        </Svg>
    )
}

export default Ballon
