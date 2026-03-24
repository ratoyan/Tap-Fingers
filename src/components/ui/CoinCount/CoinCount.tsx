import {Text, View, StyleProp} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './CoinCount.style.ts';

interface CoinCountProps {
    count: number;
    viewStyles?: StyleProp<any>;
}

function CoinCount({count, viewStyles}: CoinCountProps) {
    return (
        <View style={[styles.container, viewStyles && viewStyles]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${count} coins`}
        >
            <Coin width={22} height={20}/>
            <Text style={styles.text}>{count}</Text>
        </View>
    );
}

export default CoinCount;