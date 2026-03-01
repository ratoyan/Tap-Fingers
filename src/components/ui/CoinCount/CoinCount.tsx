import {Text, View, StyleSheet} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

interface CoinCountProps {
    count: number;
}

function CoinCount({count}: CoinCountProps) {
    return (
        <View style={styles.container}>
            <Coin width={20} height={20}/>
            <Text style={styles.text}>{count}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingRight: 10,
        paddingLeft: 5,
        paddingVertical: 5,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    text: {
        color: "gold",
        fontWeight: "bold",
        fontSize: 16,
        marginLeft: 10,
    },
});

export default CoinCount;