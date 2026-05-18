import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';
import {getTrophyEmoji} from "../../utils/helpers.ts";
import {useTranslation} from "react-i18next";

// services
import * as scoreService from "../../services/scoreService.ts";
import * as gameService from "../../services/gameService.ts";
import {ScoreEntry} from "../../services/types.ts";

// store
import {useConfigStore} from "../../store/configStore.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ProgressItem from "../../components/ui/ProgressItem/ProgressItem.tsx";
import EmptyProgression from "../../components/ui/EmptyProgression/EmptyProgression.tsx";

// styles
import styles from './Progression.style.ts';
import {WHITE} from "../../constants/colors.ts";

function Progression() {
    const {t} = useTranslation();

    const [entries, setEntries] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const setLevelLength = useConfigStore(s => s.setLevelLength);

    const load = useCallback(async () => {
        try {
            const [board, config] = await Promise.all([
                scoreService.getLeaderboard(1, 50),
                gameService.getGameConfig().catch(() => null),
            ]);
            setEntries(board.scores);
            if (config?.TAPS_PER_LEVEL) {
                setLevelLength(config.TAPS_PER_LEVEL);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }, [setLevelLength]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    // ProgressItem owns the bar math (reads levelLength from the global
    // configStore); we just hand it the leaderboard's level ceiling so every
    // row fills relative to the highest level reached.
    const topLevel = entries.reduce(
        (max, entry) => (entry.levelReached > max ? entry.levelReached : max),
        1,
    );

    return (
        <View
            style={styles.container}
            accessible={true}
            accessibilityLabel="Progression screen"
        >
            <BackHeader title={`🏆 ${t('progression')}`} />

            {loading ? (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={WHITE}/>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    style={{ marginTop: 20, flex: 1 }}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <ProgressItem
                            item={{
                                id: item.id,
                                username: item.username,
                                level: item.levelReached,
                                score: item.score,
                            }}
                            topLevel={topLevel}
                            trophy={getTrophyEmoji(index)}
                        />
                    )}
                    accessibilityRole="list"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        entries.length === 0
                            ? {flexGrow: 1}
                            : {paddingBottom: 40}
                    }
                    ListEmptyComponent={<EmptyProgression />}
                />
            )}
        </View>
    );
}

export default Progression;
