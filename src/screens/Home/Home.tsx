import React, {useCallback} from 'react';
import {ScrollView, View} from "react-native";
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/RootStackParamList';
import {MenuType} from "../../types/menu.type.ts";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getBackground, getCard, getCoin, loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import {useFocusEffect} from "@react-navigation/core";
import {menus} from "../../data/menu.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {useGlobalStore} from "../../store/globalStore.ts";
import {useShopStore} from "../../store/shopStore.ts";

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
    const {setCard, setBackground} = useShopStore();

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
                const card = await getCard();
                const background = await getBackground();

                setCoins(value);
                setCard(card);
                setBackground(background);
            };

            const timeout = setTimeout(() => {
                fetchCoin();
            }, 100);

            return () => {
                clearTimeout(timeout);
            };
        }, [])
    );

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Main menu screen"
        >
            <CoinCount
                count={coins}
                viewStyles={[globalStyles.coinView, {top: insets.top + TOP_OFFSET}]}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + TOP_OFFSET}]}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <Logo width={160} height={160} viewStyles={styles.logo}/>

                <View accessible={true} accessibilityLabel="Main menu options">
                    {menus.map((menu: MenuType, index: number) => (
                        <MenuButton menu={menu} key={index}/>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

export default Home;