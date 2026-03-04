import React from "react";
import {Text, View} from "react-native";

// styles
import styles from './ChallengeCard.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, GRAY_100, GRAY_50} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";
import Coin from "../../../assets/icons/Coin.tsx";

interface ChallengeCardProps {
    item: any
}

function ChallengeCard({item}: ChallengeCardProps) {
    return (
        <LinearGradient
            colors={
                item.locked
                    ? [GRAY_100, GRAY_50]
                    : [GRADIENT_LIGHT, GRADIENT_DARK]
            }
            style={styles.card}
        >
            <Text style={styles.title}>
                {item.locked ? '🔒 ' : '🔥 '}
                {item.title}
            </Text>

            {!item.locked && (
                <>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {width: `${item.progress}%`},
                            ]}
                        />
                    </View>

                    <Text style={styles.progressText}>
                        {item.progress}% Completed
                    </Text>

                    <View style={styles.rewardView}>
                        <Coin width={23} height={20}/>
                        <Text style={styles.reward}>
                            Reward: {item.reward} coins
                        </Text>
                    </View>
                </>
            )}

            {item.locked && (
                <Text style={styles.lockedText}>
                    Complete previous challenge to unlock
                </Text>
            )}
        </LinearGradient>
    )
}

export default ChallengeCard;