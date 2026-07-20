import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';
import {useTranslation} from "react-i18next";
import LinearGradient from 'react-native-linear-gradient';

// services / store
import * as challengeService from "../../services/challengeService.ts";
import {ChallengeWithProgress} from "../../services/types.ts";
import {useAuthStore} from "../../store/authStore.ts";
import {playSfx} from "../../utils/sfx.ts";
import {haptic} from "../../utils/haptics.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ChallengeCard from "../../components/ui/ChallengeCard/ChallengeCard.tsx";

// styles
import styles from './Challenges.style.ts';
import {DARK_PURPLE, PURPLE, WHITE} from "../../constants/colors.ts";

// Challenges fetched per page; the backend caps `limit` at 100.
const PAGE_SIZE = 15;

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

// Display ordering: collectable challenges first (finished, reward not yet
// claimed), then the ones already claimed ("done"), then everything still in
// progress. Lower rank sorts earlier.
function sortRank(c: ChallengeWithProgress): number {
    if (c.progress.isCompleted && !c.progress.isRewardClaimed) return 0; // collectable
    if (c.progress.isRewardClaimed) return 1;                            // done
    return 2;                                                            // in progress
}

// Stable sort by rank, so the within-group order (server order) is preserved.
// Applied once per fetched page — never on already-rendered items, otherwise
// claiming a reward would re-rank the card and yank it out from under the tap.
// The new order shows up the next time the screen is entered.
function sortByRank(list: ChallengeWithProgress[]): ChallengeWithProgress[] {
    return list
        .map((item, index) => ({item, index}))
        .sort((a, b) => sortRank(a.item) - sortRank(b.item) || a.index - b.index)
        .map(({item}) => item);
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
            // Each page is sorted on its own and appended, so loading more never
            // reshuffles the rows the user is already looking at.
            const page = sortByRank(board.challenges);
            setItems(prev => (reset ? page : [...prev, ...page]));
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
            // After the server confirms, not on press — the fanfare is the
            // receipt for the coins, and it would be a lie if the claim failed.
            playSfx('claim');
            haptic('claim');
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
            playSfx('denied');
            haptic('denied');
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
