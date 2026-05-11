import {Text, View, StyleProp, TouchableOpacity} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './CoinCount.style.ts';

interface CoinCountProps {
    count?: number;
    viewStyles?: StyleProp<any>;
    onPress?: () => void;
}

function CoinCount({count, viewStyles, onPress}: CoinCountProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.75 : 1}
            style={[styles.container, viewStyles && viewStyles]}
            accessible={true}
            accessibilityRole={onPress ? 'button' : 'text'}
            accessibilityLabel={`${count} coins`}
        >
            <Coin width={22} height={20}/>
            <Text allowFontScaling={false} style={styles.text}>{count}</Text>
        </TouchableOpacity>
    );
}

export default CoinCount;