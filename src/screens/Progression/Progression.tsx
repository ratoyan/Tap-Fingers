import React from 'react';
import { View, FlatList } from 'react-native';
import {getTrophyEmoji} from "../../utils/helpers.ts";
import {useTranslation} from "react-i18next";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ProgressItem from "../../components/ui/ProgressItem/ProgressItem.tsx";

// styles
import styles from './Progression.style.ts';

// Example data for user progress
const userProgress = [
    { id: '3', level: 3, score: 450, avatar: 'https://i.pravatar.cc/150?img=3', progress: 0.9 },
    { id: '2', level: 2, score: 300, avatar: 'https://i.pravatar.cc/150?img=2', progress: 0.7 },
    { id: '1', level: 1, score: 120, avatar: 'https://i.pravatar.cc/150?img=1', progress: 0.4 },
];

function Progression() {
    const {t} = useTranslation();

    return (
        <View style={styles.container}>
            <BackHeader title={`🏆 ${t('progression')}`}/>
            <FlatList
                data={userProgress}
                style={{marginTop: 20}}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                    const trophy = getTrophyEmoji(index);
                    return <ProgressItem item={item} trophy={trophy} key={index}/>;
                }}
            />
        </View>
    );
}

export default Progression;