import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

function LanguageIcon(props: any) {
    const color = props.color ?? '#fff'
    const size = props.size ?? 22
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8}/>
            <Path
                d="M3 12h18M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
        </Svg>
    )
}

export default LanguageIcon
