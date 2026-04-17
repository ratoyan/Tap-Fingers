import * as React from "react"
import Svg, {Path, Circle} from "react-native-svg"

function MusicIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M9 18V6l12-2v12"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={1.8}/>
            <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth={1.8}/>
        </Svg>
    )
}

export default MusicIcon
