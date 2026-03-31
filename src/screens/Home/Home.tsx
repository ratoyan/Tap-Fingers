import React, {useCallback, useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/RootStackParamList';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {menus} from "../../data/menu.ts";
import {MenuType} from "../../types/menu.type.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {getCoin, loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import {useFocusEffect} from "@react-navigation/core";
import {AppState, View} from "react-native";
import {useGlobalStore} from "../../store/globalStore.ts";

// components
import MenuButton from "../../components/ui/MenuButton/MenuButton.tsx";
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import Logo from "../../components/ui/Logo/Logo.tsx";

// styles
import styles from './Home.style.ts';
import globalStyles from '../../styles/globalStyle.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const Home: React.FC<Props> = () => {
    const insets = useSafeAreaInsets();
    const {coins, setCoins} = useGlobalStore();

    useFocusEffect(
        React.useCallback(() => {
            // This runs every time the screen is focused
            releaseMusic();

            loadMusic("gamemusic2.mp3");

            const timeout = setTimeout(() => {
                playMusic();
            }, 200);

            return () => {
                clearTimeout(timeout);
            };

        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const fetchCoin = async () => {
                const value = await getCoin();
                setCoins(value);
            };

            const timeout = setTimeout(() => {
                fetchCoin();
            }, 100);

            return () => {
                clearTimeout(timeout);
            };
        }, [])
    );

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'inactive') {
                releaseMusic();
            }

            if (state === 'active') {
                playMusic();
            }
        });

        return () => sub.remove();
    }, []);

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Main menu screen"
        >
            <Logo
                width={150}
                height={150}
                viewStyles={[globalStyles.logoView, {top: insets.top + TOP_OFFSET}]}
            />

            <CoinCount
                count={coins}
                viewStyles={[globalStyles.coinView, {top: insets.top + TOP_OFFSET}]}
            />

            <View accessible={true} accessibilityLabel="Main menu options">
                {menus.map((menu: MenuType, index: number) => {
                    return (
                        <MenuButton
                            menu={menu}
                            key={index}
                        />
                    );
                })}
            </View>
        </LinearGradient>
    );
};

export default Home;