import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/core';
import {getTrophyEmoji} from "../../utils/helpers.ts";
import {useTranslation} from "react-i18next";

// services
import * as scoreService from "../../services/scoreService.ts";
import {ScoreEntry} from "../../services/types.ts";

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

    const load = useCallback(async () => {
        try {
            const board = await scoreService.getLeaderboard(1, 50);
            setEntries(board.scores);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    // Progress bar shows each entry's score relative to the current #1.
    const topScore = entries.length ? entries[0].score : 0;

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
                                progress: topScore > 0 ? item.score / topScore : 0,
                            }}
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
