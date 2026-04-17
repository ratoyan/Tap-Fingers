import * as React from "react"
import Svg, {Path} from "react-native-svg"

function FlameIcon(props: any) {
    const size = props.size ?? 48
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
            <Path
                d="M32 4C32 4 20 18 20 30c0 6.627 5.373 12 12 12s12-5.373 12-12c0-4-2-7-2-7s-1 4-4 6c0 0 2-8-6-25z"
                fill="#FF6B00"
            />
            <Path
                d="M32 4C32 4 20 18 20 30c0 6.627 5.373 12 12 12s12-5.373 12-12c0-4-2-7-2-7s-1 4-4 6c0 0 2-8-6-25z"
                fill="url(#flameGrad)"
                opacity={0.85}
            />
            <Path
                d="M32 26c0 0-6 6-6 11a6 6 0 0012 0c0-3-1-5-1-5s-1 2-2 3c0 0 1-4-3-9z"
                fill="#FFD700"
                opacity={0.9}
            />
        </Svg>
    )
}

export default FlameIcon
