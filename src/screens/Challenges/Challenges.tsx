import React, {useCallback, useRef, useState} from 'react';
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

// Challenges fetched per page; the backend caps `limit` at 100.
const PAGE_SIZE = 10;

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
    const [loading, setLoading] = useState(true);          // first page only
    const [loadingMore, setLoadingMore] = useState(false); // footer spinner
    const [claimingId, setClaimingId] = useState<number | null>(null);

    // Pagination cursor in refs so onEndReached reads live values without the
    // callback having to be re-created on every appended page.
    const pageRef = useRef(0);          // highest page already loaded (0 = none yet)
    const totalPagesRef = useRef(1);    // ceiling reported by the server
    const inFlightRef = useRef(false);  // guards against overlapping fetches

    // Loads one page of challenges. `reset` restarts from page 1 (focus refresh);
    // otherwise it appends the next page for infinite scroll.
    const loadPage = useCallback(async (reset: boolean) => {
        if (inFlightRef.current) return;                            // already fetching
        const nextPage = reset ? 1 : pageRef.current + 1;
        if (!reset && nextPage > totalPagesRef.current) return;     // no more pages

        inFlightRef.current = true;
        if (reset) setLoading(true); else setLoadingMore(true);

        try {
            const board = await challengeService.getMyChallenges(nextPage, PAGE_SIZE);
            pageRef.current = board.page;
            totalPagesRef.current = board.totalPages;
            setItems(prev => (reset ? board.challenges : [...prev, ...board.challenges]));
        } catch (error) {
            console.error('Failed to load challenges:', error);
        } finally {
            inFlightRef.current = false;
            if (reset) setLoading(false); else setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            pageRef.current = 0;
            totalPagesRef.current = 1;
            loadPage(true);
        }, [loadPage])
    );

    const handleEndReached = useCallback(() => {
        loadPage(false);
    }, [loadPage]);

    async function handleClaim(challengeId: number) {
        if (claimingId) return;
        setClaimingId(challengeId);
        try {
            await challengeService.claimChallenge(challengeId);
            // Mark this challenge claimed in place (and pull the new coin balance)
            // rather than reloading from page 1 — keeps scroll position and the
            // already-loaded pages intact.
            setItems(prev => prev.map(c =>
                c.id === challengeId
                    ? {...c, progress: {...c.progress, isRewardClaimed: true}}
                    : c,
            ));
            await refreshProfile();
        } catch (error) {
            console.error('Failed to claim challenge:', error);
        } finally {
            setClaimingId(null);
        }
    }

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{paddingVertical: 20}}>
                <ActivityIndicator size="small" color={WHITE}/>
            </View>
        );
    };

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
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={renderFooter}
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
