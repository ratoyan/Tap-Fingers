import React, {useCallback, useRef, useState} from 'react';
import {Animated, ScrollView, Text, TouchableOpacity, View} from "react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";

// components
import MenuButton from "../../components/ui/MenuButton/MenuButton.tsx";
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import Logo from "../../components/ui/Logo/Logo.tsx";
import LuckyWheelModal from "../../components/ui/LuckyWheel/LuckyWheelModal.tsx";

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
    const [showWheel, setShowWheel] = useState(false);
    const [canSpin, setCanSpin] = useState(false);
    const wheelScale = useRef(new Animated.Value(1)).current;

    const checkCanSpin = useCallback(async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.LUCKY_SPIN_DATE);
        if (!raw) { setCanSpin(true); return; }
        const last = new Date(raw);
        const now = new Date();
        setCanSpin(
            last.getFullYear() !== now.getFullYear() ||
            last.getMonth() !== now.getMonth() ||
            last.getDate() !== now.getDate()
        );
    }, []);

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

    useFocusEffect(useCallback(() => { checkCanSpin(); }, [checkCanSpin]));

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

            {/* Lucky Wheel — top left floating button */}
            <View style={[styles.wheelShadow, {top: insets.top + 8}]}>
                <Animated.View style={{transform: [{scale: wheelScale}]}}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPressIn={() => Animated.spring(wheelScale, {toValue: 0.9,  useNativeDriver: true}).start()}
                        onPressOut={() => Animated.spring(wheelScale, {toValue: 1, friction: 4, useNativeDriver: true}).start()}
                        onPress={() => setShowWheel(true)}
                    >
                        <LinearGradient
                            colors={['#2a0052', '#1a0035', '#0e001f']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.wheelGradient}
                        >
                            {canSpin && (
                                <View style={styles.wheelFreeBadge}>
                                    <Text style={styles.wheelFreeBadgeText}>FREE</Text>
                                </View>
                            )}

                            <Text style={styles.wheelEmoji}>🎡</Text>
                            <View style={styles.wheelSeparator}/>
                            <Text style={styles.wheelSpinText}>SPIN</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            <LuckyWheelModal
                visible={showWheel}
                onClose={() => setShowWheel(false)}
                onSpinComplete={() => setCanSpin(false)}
            />
        </LinearGradient>
    );
};

export default Home;