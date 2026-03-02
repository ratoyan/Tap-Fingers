import * as React from "react"
import Svg, { Path } from "react-native-svg"

function SvgComponent(props: any) {
    return (
        <Svg
            fill="#fff"
            height="30px"
            width="30px"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 26.676 26.676"
            xmlSpace="preserve"
            {...props}
        >
            <Path d="M26.105 21.891a.568.568 0 01-.529-.346c-.066-.156-1.716-3.857-7.885-4.59-1.285-.156-2.824-.236-4.693-.25v4.613a.574.574 0 01-.304.508.577.577 0 01-.588-.033L.254 13.815a.573.573 0 010-.953l11.857-7.979a.563.563 0 01.588-.029c.19.102.303.295.303.502v4.293c2.578.336 13.674 2.33 13.674 11.674a.574.574 0 01-.459.562c-.037.006-.076.006-.112.006z" />
        </Svg>
    )
}

export default SvgComponent
