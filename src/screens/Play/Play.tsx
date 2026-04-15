import React, {useEffect, useMemo, useRef, useState} from 'react';
import {BoxType} from "../../types/play.type.ts";
import Sound from "react-native-sound";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, pauceMusic, playMusic, releaseMusic, stopMusic} from "../../utils/helpers.ts";
import {Dimensions, ImageBackground, TouchableOpacity, Vibration, View} from 'react-native';
import {boxes, colors, images} from "../../data/play.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import {useShopStore} from "../../store/shopStore.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuId from 'react-native-uuid';

// icons
import Back from "../../assets/icons/Back.tsx";

// components
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import PlayBox from "../../components/ui/Play/PlayBox.tsx";
import Hearts from "../../components/ui/Play/Hearts.tsx";
import LoseModal from "../../components/ui/Play/LoseModal.tsx";
import Level from "../../components/ui/Play/Level.tsx";
import Progress from "../../components/ui/Play/Progress.tsx";

// styles
import styles from './Play.style.ts'
import {GRADIENT_LIGHT} from "../../constants/colors.ts";

const {width, height} = Dimensions.get('window');

const HEARTS_LENGTH = 7;
const LEVEL_LENGTH = 30;
const MAX_ITEMS = 15;

export default function Play() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const {card} = useShopStore();

    const cancelSoundRef: any = useRef(true);
    const cancelVibrationRef: any = useRef(true);
    const durationRef = useRef(30 as number);
    const musicJumpingRef: any = useRef<Sound | null>(null);

    const [count, setCount] = useState<number>(0);
    const [levelCount, setLevelCount] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isLoseModal, setIsLoseModal] = useState<boolean>(false);
    const [duration, setDuration] = useState<number | any>(20);
    const [boxesData, setBoxesData] = useState<BoxType[]>(
        boxes.map((b: BoxType) => ({
            ...b,
            x: Math.random() * (width - b.size[0]),
            y: Math.random() * -1000,
            tx: Math.random() * (width - b.size[0]),
            ty: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))
    );

    const backgroundImg = useMemo(() => imageBackground(count), [count]);

    function backHandler() {
        setCoinStorage();
        navigation.goBack();
    }

    function imageBackground(count: number) {
        if (count > 120) return images[3];
        if (count > 80) return images[2];
        if (count > 40) return images[1];
        return images[0];
    }

    function handleRetry() {
        setCount(0);
        setLevelCount(0);
        setLevel(1);
        setEmptyHeartCount(0);
        setIsPlaying(true);
        setIsLoseModal(false);
        setDuration(15);
        setBoxesData(
            boxes.map((b: BoxType) => ({
                ...b,
                x: Math.random() * (width - b.size[0]),
                y: Math.random() * -1000,
                tx: Math.random() * (width - b.size[0]),
                ty: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
            }))
        )
    }

    function handleBack() {
        // setIsLevelModal(false);
        backHandler();
    }

    function gameOver() {
        setIsPlaying(false);
        setIsLoseModal(true);
        stopMusic();
    }

    function boomBox(box: any) {
        setBoxesData((prev: any[]) =>
            prev.map((b) =>
                b.id === box.id ? {...b, isBoom: true} : b
            )
        );

        setTimeout(() => {
            setBoxesData((prev: any[]) =>
                prev.filter((b) => b.id !== box.id)
            );
        }, 2000);
    }

    async function setCoinStorage() {
        try {
            const coin = await AsyncStorage.getItem(STORAGE_KEYS.COIN);
            const currentCoin = coin ? JSON.parse(coin) : 0;

            const updatedCoin = currentCoin + count;

            await AsyncStorage.setItem(
                STORAGE_KEYS.COIN,
                JSON.stringify(updatedCoin)
            );
        } catch (error) {
            console.log("Coin storage error:", error);
        }
    }

    async function durationAdd(val: number = 40) {
        await setCoinStorage();

        setLevel(level => level + 1);

        // @ts-ignore
        setBoxesData((prev: BoxType[]) =>
            prev.map((e: BoxType) => ({
                ...e,
                // @ts-ignore
                duration: e.duration + val,
            }))
        );

        setDuration((olValue: number) => olValue + val);
    }

    async function boomAndAddClick(box: any) {
        if (!cancelSoundRef.current && musicJumpingRef.current) {
            musicJumpingRef.current.setCurrentTime(0);
            musicJumpingRef.current.play();
        }

        if (box.isBoom) return;

        boomBox(box);

        setCount((count) => count + 1);

        setLevelCount((count) => count + 1);
    }

    async function getStorageData() {
        const cancelSound = await AsyncStorage.getItem(STORAGE_KEYS.SOUND)
        const cancelVibration = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION)

        cancelSoundRef.current = cancelSound ?? false;
        cancelVibrationRef.current = cancelVibration ?? false;
    }

    useFocusEffect(
        React.useCallback(() => {
            // This runs every time the screen is focused
            releaseMusic();

            getStorageData();

            setTimeout(() => {
                loadMusic('games1.mp3');
            }, 100)

            const timeout = setTimeout(() => {
                playMusic();
            }, 300);

            return () => {
                clearTimeout(timeout);
                pauceMusic();
                musicJumpingRef.current?.release();
            };

        }, [])
    );

    useEffect(() => {
        const sound = new Sound('jumping.wav', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load game sound', error);
            }
        });

        musicJumpingRef.current = sound;

        return () => {
            sound.release();
        };
    }, []);

    useEffect(() => {
        if (levelCount >= LEVEL_LENGTH) {
            setLevelCount(0);
            durationAdd();
        }
    }, [levelCount]);

    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const animate = () => {
            setBoxesData((prev) =>
                prev.map((b: any) => {
                    if (b.isBoom) return b;

                    const dx = b.tx - b.x;
                    const dy = b.ty - b.y;

                    let newX = b.x + dx * 0.05;
                    let newY = b.y + dy * 0.05;
                    let newColor = b.color;

                    if (newY + b.size[1] > height) {
                        newY = -Math.random() * 500;
                        newColor = colors[Math.floor(Math.random() * colors.length)];
                        setEmptyHeartCount(heartCount => {
                            if (heartCount < HEARTS_LENGTH) {
                                if (!cancelVibrationRef.current) {
                                    Vibration.vibrate(1000);
                                }
                                return heartCount + 1;
                            }
                            gameOver();
                            return heartCount;
                        });
                    }

                    const newTx = Math.abs(dx) < 1 ? Math.random() * (width - 100) : b.tx;
                    const newTy = b.y + durationRef.current;
                    const newRotation = (b.rotation + 2) % 360; // 2 degrees per frame

                    return {
                        ...b,
                        x: newX,
                        y: newY,
                        tx: newTx,
                        ty: newTy + 10,
                        rotation: newRotation,
                        color: newColor,
                    };
                })
            );

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setBoxesData((prev: any) => {
                if (prev.length >= MAX_ITEMS) {
                    return prev;
                }

                const randomBoxData =
                    prev.length > 0
                        ? prev[Math.floor(Math.random() * prev.length)]
                        : { size: [50, 50] };

                const newItem = {
                    id: uuId.v4(),
                    x: Math.random() * (width - randomBoxData.size[0]),
                    y: Math.random() * -1000,
                    tx: Math.random() * (width - randomBoxData.size[0]),
                    ty: 0,
                    size: [50, 50],
                    rotation: 0,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    duration: durationRef.current,
                    isBoom: false,
                };

                return [...prev, newItem];
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(()=>{
        durationRef.current = duration;
    },[duration])

    return (
        // @ts-ignore
        <ImageBackground source={backgroundImg}
                         style={styles.container}
                         accessible={true}
                         accessibilityLabel="Game screen. Tap boxes to score points and avoid losing hearts"
        >
            <View
                style={styles.zIndexStyle}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Level ${level}`}
            >
                <Level level={level}/>
            </View>

            <View
                style={styles.zIndexStyle}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={`Progress ${levelCount} out of ${LEVEL_LENGTH}`}
            >
                <Progress length={LEVEL_LENGTH} coin={levelCount}/>
            </View>

            <View style={[styles.headerLeftView, {top: insets.top}]}>
                <TouchableOpacity onPress={backHandler}
                                  accessibilityRole="button"
                                  accessibilityLabel="Go back"
                                  accessibilityHint="Returns to previous screen"
                >
                    <Back color={GRADIENT_LIGHT}/>
                </TouchableOpacity>
                <View
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={`Lives remaining ${HEARTS_LENGTH - emptyHeartCount}`}
                >
                    <Hearts length={HEARTS_LENGTH} emptyCount={emptyHeartCount}/>
                </View>
            </View>

            <View
                style={styles.zIndexStyle}
                accessible={true}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
                accessibilityLabel={`Score ${count}`}
            >
                <CoinCount count={count} viewStyles={[styles.countView, {top: insets.top}]}/>
            </View>

            <LoseModal visible={isLoseModal} onRetry={handleRetry} onBack={handleBack}/>

            {boxesData
                .slice()
                .reverse()
                .map((box: BoxType) => (
                    <PlayBox key={box.id}
                             box={box}
                             card={card}
                             handlePress={() => boomAndAddClick(box)}
                    />
                ))}
        </ImageBackground>
    );
}