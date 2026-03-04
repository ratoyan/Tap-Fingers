import React from 'react';
import {
    FlatList
} from 'react-native';

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ChallengeCard from "../../components/ui/ChallengeCard/ChallengeCard.tsx";

// styles
import styles from './Challenges.style.ts';
import LinearGradient from 'react-native-linear-gradient';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";

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

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
        >
            <BackHeader title={'🎯 CHALLENGES'}/>

            <FlatList
                data={challenges}
                keyExtractor={(item) => item.id}
                renderItem={ChallengeCard}
                contentContainerStyle={{paddingBottom: 40, marginTop: 20}}
            />
        </LinearGradient>
    );
}

export default Challenges;
