import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

function SuccessIcon(props: any) {
    return (
        <Svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 50 50"
            xmlSpace="preserve"
            {...props}
        >
            <Circle cx={25} cy={25} r={25} fill="#25ae88" />
            <Path
                d="M38 15L22 33 12 25"
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={10}
            />
        </Svg>
    )
}

export default SuccessIcon
