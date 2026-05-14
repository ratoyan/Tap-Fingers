import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';
import {useTranslation} from "react-i18next";
import LinearGradient from 'react-native-linear-gradient';

// services / store
import * as challengeService from "../../services/challengeService.ts";
import {ChallengeWithProgress} from "../../services/types.ts";
import {useAuthStore} from "../../store/authStore.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ChallengeCard from "../../components/ui/ChallengeCard/ChallengeCard.tsx";

// styles
import styles from './Challenges.style.ts';
import {DARK_PURPLE, PURPLE, WHITE} from "../../constants/colors.ts";

// Maps a backend challenge (+ per-player progress) onto the shape ChallengeCard
// renders. `progress` is a 0–100 percentage; the backend has no "locked" concept,
// so every active challenge is playable.
function toCardItem(c: ChallengeWithProgress) {
    const pct = c.targetValue > 0
        ? Math.min(100, Math.round((c.progress.current / c.targetValue) * 100))
        : 0;
    return {
        id: c.id,
        title: c.title,
        progress: pct,
        reward: c.rewardCoins,
        locked: false,
        finished: c.progress.isCompleted,
        taken: c.progress.isRewardClaimed,
    };
}

function Challenges() {
    const {t} = useTranslation();
    const refreshProfile = useAuthStore(s => s.refreshProfile);

    const [items, setItems] = useState<ChallengeWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await challengeService.getMyChallenges();
            setItems(data);
        } catch (error) {
            console.error('Failed to load challenges:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    async function handleClaim(challengeId: number) {
        if (claimingId) return;
        setClaimingId(challengeId);
        try {
            await challengeService.claimChallenge(challengeId);
            // Pull fresh challenge state + the new coin balance from the server.
            await Promise.all([load(), refreshProfile()]);
        } catch (error) {
            console.error('Failed to claim challenge:', error);
        } finally {
            setClaimingId(null);
        }
    }

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Challenges screen"
        >
            <BackHeader title={`🎯 ${t('challenges')}`}/>

            {loading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={WHITE}/>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item, index}) => (
                        <ChallengeCard
                            item={toCardItem(item)}
                            index={index}
                            onCollect={() => handleClaim(item.id)}
                        />
                    )}
                    contentContainerStyle={{paddingBottom: 40, marginTop: 20}}
                    showsVerticalScrollIndicator={false}
                    accessibilityRole="list"
                    ListEmptyComponent={
                        <Text
                            allowFontScaling={false}
                            style={{color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 40}}
                        >
                            —
                        </Text>
                    }
                />
            )}
        </LinearGradient>
    );
}

export default Challenges;
