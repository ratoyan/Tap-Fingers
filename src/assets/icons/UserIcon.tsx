import * as React from "react"
import Svg, {Circle, Path} from "react-native-svg"

function UserIcon(props: any) {
    return (
        <Svg
            width={props.size ?? 34}
            height={props.size ?? 34}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <Circle cx="32" cy="20" r="14" fill={props.color ?? '#fff'} opacity={0.95}/>
            <Path
                d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24"
                fill={props.color ?? '#fff'}
                opacity={0.95}
            />
        </Svg>
    )
}

export default UserIcon
