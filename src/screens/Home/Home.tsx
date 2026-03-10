import React, {useEffect} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/RootStackParamList';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {menus} from "../../data/menu.ts";
import {MenuType} from "../../types/menu.type.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const getMusic = async () => {
        const music = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC)
        if (music) return;
        loadMusic("gamemusic2.mp3");

        const timeout = setTimeout(() => {
            playMusic();
        }, 200);

        return () => {
            clearTimeout(timeout);
            releaseMusic();
        };
    }

    useEffect(() => {
        getMusic();
    }, []);

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <Logo width={150} height={150} viewStyles={[globalStyles.logoView, {top: insets.top + TOP_OFFSET}]}/>

            <CoinCount count={20} viewStyles={[globalStyles.coinView, {top: insets.top + TOP_OFFSET}]}/>

            {menus.map((menu: MenuType, index: number) => {
                return <MenuButton menu={menu} key={index}/>;
            })}
        </LinearGradient>
    );
};

export default Home;