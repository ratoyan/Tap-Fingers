import React from "react";
import {Text, TouchableOpacity, View} from "react-native";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ChallengeCard.style.ts';
import {DARK_PURPLE, GOLD, GRADIENT_DARK, GRADIENT_LIGHT, MEDIUM_PURPLE} from "../../../constants/colors.ts";
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
                {
                    item.taken && (
                        <View style={styles.takenChallengeCard}>
                            <Text style={{marginRight: 6}}>✅</Text>
                            <Text style={styles.takenChallengeText}>Taken</Text>
                        </View>
                    )
                }

                {
                    item.finished && (
                        <View style={styles.coinBackground}>
                            <TouchableOpacity style={styles.coinActionButton}>
                                <Coin width={25} height={25}/>
                                <Text style={styles.coinText}>
                                    100
                                </Text>
                                <Text style={styles.coinText}>
                                    coins
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>
        </LinearGradient>
    )
}

export default ChallengeCard;