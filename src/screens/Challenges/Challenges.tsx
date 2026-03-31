import React from 'react';
import {
    FlatList
} from 'react-native';

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ChallengeCard from "../../components/ui/ChallengeCard/ChallengeCard.tsx";

// styles
import styles from './Challenges.style.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import {useTranslation} from "react-i18next";
import LinearGradient from 'react-native-linear-gradient';

const challenges = [
    {
        id: '1',
        title: 'Tap 100 Times',
        progress: 70,
        reward: 50,
        locked: false,
    },
    {
        id: '2',
        title: 'Win 5 Games',
        progress: 30,
        reward: 100,
        locked: false,
    },
    {
        id: '3',
        title: 'Score 1000 Points',
        progress: 0,
        reward: 200,
        locked: true,
    },
];

function Challenges() {
    const {t} = useTranslation();

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Challenges screen"
        >
            <BackHeader title={`🎯 ${t('challenges')}`}/>

            <FlatList
                data={challenges}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ChallengeCard item={item} />
                )}
                contentContainerStyle={{ paddingBottom: 40, marginTop: 20 }}
                showsVerticalScrollIndicator={false}
                accessibilityRole="list"
            />
        </LinearGradient>
    );
}

export default Challenges;
