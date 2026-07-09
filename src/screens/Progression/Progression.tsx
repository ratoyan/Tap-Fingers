import React, {useCallback, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';
import {getTrophyEmoji} from "../../utils/helpers.ts";
import {useTranslation} from "react-i18next";

// services
import * as scoreService from "../../services/scoreService.ts";
import * as gameService from "../../services/gameService.ts";
import {MyRank, ScoreEntry} from "../../services/types.ts";

// store
import {useConfigStore} from "../../store/configStore.ts";
import {useAuthStore} from "../../store/authStore.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ProgressItem from "../../components/ui/ProgressItem/ProgressItem.tsx";
import EmptyProgression from "../../components/ui/EmptyProgression/EmptyProgression.tsx";

// styles
import styles from './Progression.style.ts';
import {WHITE} from "../../constants/colors.ts";

// Rows fetched per page. The backend caps `limit` at 100; 10 keeps each
// scroll-triggered request small so new rows stream in smoothly.
const PAGE_SIZE = 15;

function Progression() {
    const {t} = useTranslation();

    const [entries, setEntries] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);        // first page only
    const [loadingMore, setLoadingMore] = useState(false); // footer spinner
    const [myRank, setMyRank] = useState<MyRank | null>(null); // signed-in player's own standing

    // Pagination cursor kept in refs so onEndReached reads live values without
    // having to be re-created (and re-bound) on every appended page.
    const pageRef = useRef(0);          // highest page already loaded (0 = none yet)
    const totalPagesRef = useRef(1);    // ceiling reported by the server
    const inFlightRef = useRef(false);  // guards against overlapping fetches

    const setLevelLength = useConfigStore(s => s.setLevelLength);
    const setAdsEnabled = useConfigStore(s => s.setAdsEnabled);

    // The signed-in player's id — used to highlight their own row(s) in the
    // list now that usernames are no longer unique.
    const myPlayerId = useAuthStore(s => s.player?.id);

    // Loads one leaderboard page. `reset` restarts from page 1 (focus refresh);
    // otherwise it appends the next page for infinite scroll.
    const loadPage = useCallback(async (reset: boolean) => {
        if (inFlightRef.current) return;                              // already fetching
        const nextPage = reset ? 1 : pageRef.current + 1;
        if (!reset && nextPage > totalPagesRef.current) return;       // no more pages

        inFlightRef.current = true;
        if (reset) setLoading(true); else setLoadingMore(true);

        try {
            // The game config and the player's own rank only need fetching once
            // (on the reset/initial load); appended pages skip them.
            const [board, config, rank] = await Promise.all([
                scoreService.getLeaderboard(nextPage, PAGE_SIZE),
                reset ? gameService.getGameConfig().catch(() => null) : Promise.resolve(null),
                reset ? scoreService.getMyRank().catch(() => null) : Promise.resolve(null),
            ]);

            pageRef.current = board.page;
            totalPagesRef.current = board.totalPages;
            // Drop any rows already in the list before appending. Offset paging
            // (plus per-page server caching) can occasionally re-emit a row at a
            // page boundary; deduping by id keeps FlatList keys unique.
            setEntries(prev => {
                if (reset) return board.scores;
                const seen = new Set(prev.map(e => e.id));
                return [...prev, ...board.scores.filter(e => !seen.has(e.id))];
            });

            if (reset) setMyRank(rank);
            if (config?.TAPS_PER_LEVEL) {
                setLevelLength(config.TAPS_PER_LEVEL);
            }
            if (config && typeof config.adsEnabled === 'boolean') {
                setAdsEnabled(config.adsEnabled);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            inFlightRef.current = false;
            if (reset) setLoading(false); else setLoadingMore(false);
        }
    }, [setLevelLength]);

    useFocusEffect(
        useCallback(() => {
            // Refresh from the top each time the screen gains focus.
            pageRef.current = 0;
            totalPagesRef.current = 1;
            loadPage(true);
        }, [loadPage])
    );

    const handleEndReached = useCallback(() => {
        loadPage(false);
    }, [loadPage]);

    // ProgressItem owns the bar math (reads levelLength from the global
    // configStore); we just hand it the leaderboard's level ceiling so every
    // row fills relative to the highest level reached.
    const topLevel = useMemo(
        () => entries.reduce(
            (max, entry) => (entry.levelReached > max ? entry.levelReached : max),
            1,
        ),
        [entries],
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{paddingVertical: 20}}>
                <ActivityIndicator size="small" color={WHITE}/>
            </View>
        );
    };

    return (
        <View
            style={styles.container}
            accessible={true}
            accessibilityLabel="Progression screen"
        >
            <BackHeader title={`🏆 ${t('progression')}`}/>

            {loading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={WHITE}/>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    style={{marginTop: 20, flex: 1}}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item, index}) => (
                        <ProgressItem
                            item={{
                                id: item.id,
                                playerId: item.playerId,
                                username: item.username,
                                level: item.levelReached,
                                score: item.score,
                            }}
                            topLevel={topLevel}
                            trophy={getTrophyEmoji(index)}
                            index={index}
                            isMe={!!myPlayerId && item.playerId === myPlayerId}
                        />
                    )}
                    accessibilityRole="list"
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={
                        entries.length === 0
                            ? {flexGrow: 1}
                            // Leave room so the last rows can scroll clear of the
                            // pinned "your rank" footer when it's shown.
                            : {paddingBottom: myRank?.entry ? 120 : 40}
                    }
                    ListEmptyComponent={<EmptyProgression/>}
                />
            )}

            <View style={{height: 50}}/>

            {/* Signed-in player's own row, pinned over the bottom of the list. */}
            {!loading && myRank?.entry && (
                <View style={styles.pinned} pointerEvents="box-none">
                    <View style={styles.pinnedDivider}/>
                    <ProgressItem
                        item={{
                            id: myRank.entry.id,
                            playerId: myRank.entry.playerId,
                            username: myRank.entry.username,
                            level: myRank.entry.levelReached,
                            score: myRank.entry.score,
                        }}
                        topLevel={topLevel}
                        trophy={getTrophyEmoji((myRank.rank ?? 1) - 1)}
                        index={(myRank.rank ?? 1) - 1}
                        isMe
                    />
                </View>
            )}
        </View>
    );
}

export default Progression;
