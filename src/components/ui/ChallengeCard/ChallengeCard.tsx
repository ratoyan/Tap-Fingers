import React from "react";
import {Text, View} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ChallengeCard.style.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, MEDIUM_PURPLE} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface ChallengeCardProps {
    item: any
}

function ChallengeCard({item}: ChallengeCardProps) {
    const label = item.locked
        ? `${item.title}. Locked. Complete previous challenge to unlock`
        : `${item.title}. ${item.progress}% completed. Reward ${item.reward} coins`;

    return (
        <LinearGradient
            colors={
                item.locked
                    ? [MEDIUM_PURPLE, MEDIUM_PURPLE]
                    : [GRADIENT_LIGHT, GRADIENT_DARK]
            }
            style={styles.card}

            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={label}
        >
            <View importantForAccessibility="no-hide-descendants">
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
            </View>
        </LinearGradient>
    )
}

export default ChallengeCard;