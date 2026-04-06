import React, {useEffect, useMemo, useRef, useState} from 'react';
import {BoxType} from "../../types/play.type.ts";
import Sound from "react-native-sound";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, pauceMusic, playMusic, releaseMusic, stopMusic} from "../../utils/helpers.ts";
import {Dimensions, ImageBackground, TouchableOpacity, Vibration, View} from 'react-native';
import {boxes, colors, images} from "../../data/play.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";

// icons
import Back from "../../assets/icons/Back.tsx";

// components
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import PlayBox from "../../components/ui/Play/PlayBox.tsx";
// import LevelModalExample from "../../components/ui/Play/LevelModalExample.tsx";
import Hearts from "../../components/ui/Play/Hearts.tsx";
import LoseModal from "../../components/ui/Play/LoseModal.tsx";
import Level from "../../components/ui/Play/Level.tsx";
import Progress from "../../components/ui/Play/Progress.tsx";

// styles
import styles from './Play.style.ts'
import {GRADIENT_LIGHT} from "../../constants/colors.ts";

const {width, height} = Dimensions.get('window');

export default function Play() {
    const heartsLength = 7;
    const levelLength = 10;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const cancelSoundRef: any = useRef(true);
    const cancelVibrationRef: any = useRef(true);
    const musicJumpingRef: any = useRef<Sound | null>(null);

    const [count, setCount] = useState(0);
    const [levelCount, setLevelCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    // const [isLevelModal, setIsLevelModal] = useState(false);
    const [isLoseModal, setIsLoseModal] = useState(false);
    const [duration, setDuration] = useState(15);
    const backgroundImg = useMemo(() => imageBackground(count), [count]);

    const [boxesData, setBoxesData] = useState(
        boxes.map((b: BoxType) => ({
            ...b,
            x: Math.random() * (width - b.size[0]),
            y: Math.random() * -1000,
            tx: Math.random() * (width - b.size[0]),
            ty: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))
    );

    function backHandler() {
        setCoinStorage();
        navigation.goBack();
    }

    function imageBackground(count: number) {
        switch (true) {
            case count > 40:
                return images[3];
            case count > 80:
                return images[2];
            case count > 120:
                return images[1];
            default:
                return images[0];
        }
    }

    function handleRetry() {
        setCount(0);
        setLevelCount(0);
        setLevel(1);
        setEmptyHeartCount(0);
        setIsPlaying(true);
        // setIsLevelModal(false);
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

    async function setCoinStorage() {
        let coin = await AsyncStorage.getItem(STORAGE_KEYS.COIN);
        let currentCoin = coin ? JSON.parse(coin) : 0;
        const updatedCoin = currentCoin + count;

        await AsyncStorage.setItem(
            STORAGE_KEYS.COIN,
            JSON.stringify(updatedCoin)
        );
    }

    async function durationAdd(val: number = 10) {
        setCoinStorage();
        setLevel(level => level + 1);
        // @ts-ignore
        setBoxesData((prev: BoxType[]) =>
            prev.map((e: BoxType) => ({
                ...e,
                // @ts-ignore
                duration: e.duration + val,
            }))
        );
        setDuration((olValue) => olValue + val);
    }

    function addRandomBox() {
        // @ts-ignore
        setBoxesData((prev: BoxType[]) => {
            const newId = prev.length ? Math.max(...prev.map(b => b.id)) + 1 : 1;

            const randomBoxData = prev[Math.floor(Math.random() * prev.length)];

            if (!randomBoxData) return prev;

            const newBox: BoxType = {
                ...randomBoxData,
                id: newId,
                x: Math.random() * (width - randomBoxData.size[0]), // X-ը էլ random
                y: Math.random() * -1000,
                // @ts-ignore
                tx: Math.random() * (width - randomBoxData.size[0]),
                ty: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: randomBoxData.rotation,
            };

            return [...prev, newBox];
        });
    }

    // function gmpBox(box: any) {
    //     setBoxesData((prev: any) => {
    //         const newId = prev.length ? Math.max(...prev.map((b: any) => b.id)) + 1 : 1;
    //
    //         const randomBoxData = prev[Math.floor(Math.random() * prev.length)];
    //         if (!randomBoxData) return prev;
    //
    //         const newBox: BoxType = {
    //             ...randomBoxData,
    //             id: newId,
    //             x: box.x,
    //             y: box.y,
    //             tx: Math.random() * (width - randomBoxData.size[0]),
    //             ty: 0,
    //             color: box.color,
    //             rotation: randomBoxData.rotation,
    //             isGmp: true
    //         };
    //
    //         // ⬇️ ADD TIMEOUT DELETE
    //         setTimeout(() => {
    //             setBoxesData((current: any) =>
    //                 current.filter((b: any) => b.id !== newId)
    //             );
    //         }, 2000); // 2 վայրկյան հետո կջնջվի
    //
    //         return [...prev, newBox];
    //     });
    // }

    async function gmpAndAddClick(box: any) {
        if (!cancelSoundRef.current && musicJumpingRef.current) {
            musicJumpingRef.current.setCurrentTime(0);
            musicJumpingRef.current.play();
        }

        if(box.isGmp) return;

        setBoxesData(prev => prev.filter(b => b.id !== box.id));

        addRandomBox();

        // gmpBox(box);

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
        if (levelCount >= levelLength) {
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
                    if(b.isGmp) return b;

                    const dx = b.tx - b.x;
                    const dy = b.ty - b.y;

                    let newX = b.x + dx * 0.05;
                    let newY = b.y + dy * 0.05;
                    let newColor = b.color;

                    if (newY + b.size[1] > height) {
                        newY = -Math.random() * 500;
                        newColor = colors[Math.floor(Math.random() * colors.length)];
                        setEmptyHeartCount(heartCount => {
                            if (heartCount < heartsLength) {
                                if (!cancelVibrationRef.current) {
                                    Vibration.vibrate(1000);
                                }
                                return heartCount + 1;
                            }
                            gameOver();
                            return heartCount;
                        });
                    }

                    const newTx = Math.abs(dx) < 1 ? Math.random() * (width - b.size[0] + 70) : b.tx;
                    const newTy = b.y + duration;
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
                accessibilityLabel={`Progress ${levelCount} out of ${levelLength}`}
            >
                <Progress length={levelLength} coin={levelCount}/>
            </View>

            {/*<LevelModalExample visible={isLevelModal}*/}
            {/*                   setVisible={(val) => {*/}
            {/*                       setIsLevelModal(val);*/}
            {/*                       setIsPlaying(true);*/}
            {/*                   }}*/}
            {/*                   level={level}*/}
            {/*/>*/}
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
                    accessibilityLabel={`Lives remaining ${heartsLength - emptyHeartCount}`}
                >
                    <Hearts length={heartsLength} emptyCount={emptyHeartCount}/>
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
                             handlePress={() => gmpAndAddClick(box)}
                    />
                ))}
        </ImageBackground>
    );
}