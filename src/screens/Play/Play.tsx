import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, Pressable, Vibration, ImageBackground} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {BoxType} from "../../types/play.type.ts";
import {boxes, colors, images} from "../../data/play.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useFocusEffect, useNavigation} from "@react-navigation/core";
import {loadMusic, playMusic, releaseMusic} from "../../utils/helpers.ts";
import {STORAGE_KEYS} from "../../utils/storageKeys.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sound from "react-native-sound";

// components
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import PlayBox from "../../components/ui/Play/PlayBox.tsx";
import LevelModalExample from "../../components/ui/Play/LevelModalExample.tsx";
import Hearts from "../../components/ui/Play/Hearts.tsx";
import LoseModal from "../../components/ui/Play/LoseModal.tsx";

// styles
import styles from './Play.style.ts'

const {width, height} = Dimensions.get('window');

export default function Play() {
    const heartsLength = 7;
    const milestones = new Set([20, 40, 60, 80, 100, 120, 140]);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const cancelSoundRef: any = useRef(true);
    const cancelVibrationRef: any = useRef(true);

    const musicJumping = new Sound('jumping.wav', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('failed to load game sound', error);
            return;
        }
    });

    const [count, setCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLevelModal, setIsLevelModal] = useState(false);
    const [isLoseModal, setIsLoseModal] = useState(false);

    const [boxesData, setBoxesData] = useState(
        boxes.map((b: BoxType) => ({
            ...b,
            x: Math.random() * (width - b.size[0]), // X-ը էլ random
            y: Math.random() * -1000,
            tx: Math.random() * (width - b.size[0]),
            ty: 0,
            duration: Math.random() * 40 + 30,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))
    );

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
                ty: 0, // կարող է գնալ ներքև
                duration: Math.random() * 70,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: randomBoxData.rotation,
            };

            return [...prev, newBox];
        });
    }

    function imageBackground(count: number) {
        switch (true) {
            case count > 20:
                return images[2];
            case count > 10:
                return images[1];
            default:
                return images[0];
        }
    }

    function durationAdd(val: number = 30) {
        setLevel(level => level + 1);
        setIsPlaying(false);
        setTimeout(() => {
            setIsLevelModal(true);
        }, 100)
        // @ts-ignore
        setBoxesData((prev: BoxType[]) =>
            prev.map((e: BoxType) => ({
                ...e,
                // @ts-ignore
                duration: e.duration + val,
            }))
        );
    }

    function handleRetry() {
        setIsLevelModal(false);
        navigation.goBack();
    }

    function gameOver() {
        setIsPlaying(false);
        setIsLoseModal(true);
        releaseMusic();
    }

    async function deleteBoxOnClick(id: number) {
        if (!cancelSoundRef.current) {
            musicJumping.setNumberOfLoops(0);
            musicJumping.play();
        }

        setBoxesData(prev => prev.filter(b => b.id !== id));
        addRandomBox();
        setCount((count) => count + 1);
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
            getStorageData();
            setTimeout(() => {
                loadMusic('games1.mp3');
            }, 100)

            const timeout = setTimeout(() => {
                playMusic();
            }, 300);

            return () => {
                clearTimeout(timeout);
                releaseMusic();
                musicJumping.release();
            };

        }, [])
    );

    useEffect(() => {
        if (milestones.has(count)) {
            durationAdd();
        } else if (count === 160) {
            durationAdd(50);
        }
    }, [count]);

    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const animate = () => {
            setBoxesData((prev) =>
                prev.map(b => {
                    const dx = b.tx - b.x;
                    const dy = b.ty - b.y;

                    let newX = b.x + dx * 0.05;
                    let newY = b.y + dy * 0.05;
                    let newColor = b.color;

                    if (newY + b.size[1] > height) {
                        newY = -Math.random() * 500;
                        newColor = colors[Math.floor(Math.random() * colors.length)];
                        setEmptyHeartCount(count => {
                            if (count < heartsLength) {
                                if (!cancelVibrationRef.current) {
                                    Vibration.vibrate(1000);
                                }
                                return count + 1;
                            }
                            gameOver();
                            return count;
                        });
                    }

                    const newTx = Math.abs(dx) < 1 ? Math.random() * (width - b.size[0]) : b.tx;
                    const newTy = b.y + b.duration;
                    const newRotation = (b.rotation + 2) % 360; // 2 degrees per frame

                    return {
                        ...b,
                        x: newX,
                        y: newY,
                        tx: newTx,
                        ty: newTy,
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

    return (
        <ImageBackground source={{uri: imageBackground(count)}} style={styles.container}>
            <LevelModalExample visible={isLevelModal} setVisible={(val) => {
                setIsLevelModal(val);
                setIsPlaying(true);
            }} level={level}/>
            <Hearts length={heartsLength} emptyCount={emptyHeartCount} viewStyle={{
                position: 'absolute',
                left: 10,
                zIndex: 1,
                top: insets.top + TOP_OFFSET
            }}/>
            <CoinCount count={count} viewStyles={[styles.countView, {top: insets.top + TOP_OFFSET}]}/>
            <LoseModal visible={isLoseModal} onRetry={handleRetry}/>
            <Canvas style={{flex: 1}}>
                {boxesData.map((box: BoxType, index: number) => (
                    <PlayBox key={index} box={box}/>
                ))}
            </Canvas>

            {boxesData
                .slice()
                .reverse()
                .map((box: BoxType, index: number) => (
                    <Pressable
                        key={index}
                        onPress={() => deleteBoxOnClick(box.id)}
                        style={[styles.boxItem, {
                            left: box.x,
                            top: box.y,
                            width: box.size[0],
                            height: box.size[1],
                        }]}
                    />
                ))}
        </ImageBackground>
    );
}