import React, {useCallback, useEffect, useRef, useState} from 'react';
import Sound from 'react-native-sound';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/core';
import {loadMusic, pauceMusic, playMusic, releaseMusic, stopMusic} from '../../utils/helpers.ts';
import {
    Animated,
    Dimensions,
    ImageBackground,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import {colors} from '../../data/play.ts';
import {STORAGE_KEYS} from '../../utils/storageKeys.ts';
import {useShopStore} from '../../store/shopStore.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuId from 'react-native-uuid';

// icons
import Back from '../../assets/icons/Back.tsx';
import BombCard from '../../assets/icons/BombCard.tsx';

// components
import CoinCount from '../../components/ui/CoinCount/CoinCount.tsx';
import PlayBox from '../../components/ui/Play/PlayBox.tsx';
import Hearts from '../../components/ui/Play/Hearts.tsx';
import LoseModal from '../../components/ui/Play/LoseModal.tsx';
import ExitModal from '../../components/ui/Play/ExitModal.tsx';
import Level from '../../components/ui/Play/Level.tsx';
import Progress from '../../components/ui/Play/Progress.tsx';

// styles
import styles from './Play.style.ts';
import {GRADIENT_LIGHT} from '../../constants/colors.ts';

const {width, height} = Dimensions.get('window');

const HEARTS_LENGTH = 7;
const LEVEL_LENGTH = 5;
const MAX_ITEMS = 5;
const INITIAL_DURATION = 20;
const DURATION_STEP = 20;
const INITIAL_BOMBS = 3;
const COMBO_WINDOW_MS = 550;
const COMBO_RESET_MS = 850;

function getDefaultBackground(level: number) {
    if (level > 4) return require('../../assets/images/background4.jpg');
    if (level > 3) return require('../../assets/images/background3.jpg');
    if (level > 2) return require('../../assets/images/background2.jpg');
    return require('../../assets/images/background1.jpg');
}

function createBoxes(card: any, duration: number) {
    return Array.from({length: MAX_ITEMS}, () => ({
        ...card,
        id: uuId.v4(),
        x: Math.random() * (width - card.size),
        y: Math.random() * -1000,
        tx: Math.random() * (width - card.size),
        ty: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration,
        isBoom: false,
    }));
}

export default function Play() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const {card, background} = useShopStore();

    // Refs
    const cancelSoundRef = useRef(true);
    const cancelVibrationRef = useRef(true);
    const durationRef = useRef(INITIAL_DURATION);
    const musicJumpingRef = useRef<Sound | null>(null);
    const musicPopRef = useRef<Sound | null>(null);
    const countRef = useRef(0);
    const bombCountRef = useRef(INITIAL_BOMBS);
    const levelRef = useRef(1);
    const watchAdUsedRef = useRef(0);
    const lastTapTimeRef = useRef(0);
    const comboCountRef = useRef(0);
    const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animated values
    const bombFlashAnim = useRef(new Animated.Value(0)).current;
    const comboScaleAnim = useRef(new Animated.Value(0)).current;
    const comboOpacityAnim = useRef(new Animated.Value(0)).current;
    const bombPulseAnim = useRef(new Animated.Value(1)).current;

    // State
    const [count, setCount] = useState(0);
    const [levelCount, setLevelCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoseModal, setIsLoseModal] = useState(false);
    const [isExitModal, setIsExitModal] = useState(false);
    const [boxesData, setBoxesData] = useState(() => createBoxes(card, durationRef.current));
    const [bombCount, setBombCount] = useState(INITIAL_BOMBS);
    const [combo, setCombo] = useState(0);
    const [watchAdUsed, setWatchAdUsed] = useState(0);

    const levelIndex = Math.min(level - 1, 4);

    // ─── Bomb pulse loop ──────────────────────────────────────────────────────

    useEffect(() => {
        if (bombCount <= 0) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(bombPulseAnim, {toValue: 1.12, duration: 700, useNativeDriver: true}),
                Animated.timing(bombPulseAnim, {toValue: 1, duration: 700, useNativeDriver: true}),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [bombCount]);

    // ─── Storage helpers ──────────────────────────────────────────────────────

    async function saveCoinStorage() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.COIN);
            const current = stored ? JSON.parse(stored) : 0;
            await AsyncStorage.setItem(STORAGE_KEYS.COIN, JSON.stringify(current + countRef.current));
        } catch (error) {
            console.log('Coin storage error:', error);
        }
    }

    async function loadSettings() {
        const cancelSound = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
        const cancelVibration = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION);
        cancelSoundRef.current = !!cancelSound;
        cancelVibrationRef.current = !!cancelVibration;
    }

    async function loadBombCount() {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOMB_COUNT);
        const saved = stored ? JSON.parse(stored) : INITIAL_BOMBS;
        const value = Math.max(saved, INITIAL_BOMBS);
        bombCountRef.current = value;
        setBombCount(value);
    }

    async function saveBombCount(count: number) {
        await AsyncStorage.setItem(STORAGE_KEYS.BOMB_COUNT, JSON.stringify(count));
    }

    // ─── Game actions ─────────────────────────────────────────────────────────

    function backHandler() {
        setIsPlaying(false);
        setIsExitModal(true);
    }

    function handleExitConfirm() {
        saveCoinStorage();
        setIsExitModal(false);
        navigation.goBack();
    }

    function handleExitCancel() {
        setIsExitModal(false);
        setIsPlaying(true);
    }

    function gameOver() {
        setIsPlaying(false);
        setIsLoseModal(true);
        stopMusic();
    }

    function handleWatchAd() {
        if (watchAdUsedRef.current >= 2) return;
        watchAdUsedRef.current += 1;
        setWatchAdUsed(watchAdUsedRef.current);
        setEmptyHeartCount(prev => Math.max(0, prev - 1));
        setIsLoseModal(false);
        setIsPlaying(true);
        setBoxesData([]);
        setTimeout(() => setBoxesData(createBoxes(card, durationRef.current)), 0);
    }

    function handleRetry() {
        durationRef.current = INITIAL_DURATION;
        countRef.current = 0;
        bombCountRef.current = INITIAL_BOMBS;
        levelRef.current = 1;
        AsyncStorage.setItem(STORAGE_KEYS.BOMB_COUNT, JSON.stringify(INITIAL_BOMBS));
        comboCountRef.current = 0;
        setCount(0);
        setLevelCount(0);
        setLevel(1);
        setEmptyHeartCount(0);
        setBombCount(INITIAL_BOMBS);
        setCombo(0);
        watchAdUsedRef.current = 0;
        setWatchAdUsed(0);
        setIsPlaying(true);
        setIsLoseModal(false);
        setBoxesData(createBoxes(card, durationRef.current));
    }

    function boomBox(id: string) {
        setBoxesData(prev => prev.map(b => (b.id === id ? {...b, isBoom: true} : b)));
        setTimeout(() => setBoxesData(prev => prev.filter(b => b.id !== id)), 2000);
    }

    // ─── Bomb helper ──────────────────────────────────────────────────────────

    function handleBomb() {
        if (bombCountRef.current <= 0 || !isPlaying) return;

        const newBombs = bombCountRef.current - 1;
        bombCountRef.current = newBombs;
        setBombCount(newBombs);
        saveBombCount(newBombs);

        if (!cancelVibrationRef.current) Vibration.vibrate([0, 80, 60, 80]);

        // Flash screen orange→transparent
        bombFlashAnim.setValue(1);
        Animated.timing(bombFlashAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
        }).start();

        // Count active (non-boom) boxes and award coins
        setBoxesData(prev => {
            const activeCount = prev.filter(b => !b.isBoom).length;
            countRef.current += activeCount;
            setCount(c => c + activeCount);
            setLevelCount(c => c + activeCount);
            return [];
        });
        setTimeout(() => setBoxesData(createBoxes(card, durationRef.current)), 150);
    }

    // ─── Combo ────────────────────────────────────────────────────────────────

    function triggerComboAnim() {
        comboScaleAnim.setValue(0.4);
        comboOpacityAnim.setValue(1);
        Animated.parallel([
            Animated.spring(comboScaleAnim, {toValue: 1, useNativeDriver: true, friction: 4}),
            Animated.sequence([
                Animated.delay(500),
                Animated.timing(comboOpacityAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
            ]),
        ]).start();
    }

    function handleTap(box: any) {
        if (box.isBoom) return;

        if (!cancelSoundRef.current) {
            if (musicJumpingRef.current) {
                const pitch = 0.8 + Math.random() * 0.7;
                musicJumpingRef.current.setSpeed(pitch);
                musicJumpingRef.current.setCurrentTime(0);
                musicJumpingRef.current.play();
            }
            if (musicPopRef.current) {
                musicPopRef.current.setCurrentTime(0);
                musicPopRef.current.play();
            }
        }

        // Combo detection
        const now = Date.now();
        if (now - lastTapTimeRef.current < COMBO_WINDOW_MS) {
            comboCountRef.current += 1;
        } else {
            comboCountRef.current = 1;
        }
        lastTapTimeRef.current = now;

        if (comboCountRef.current >= 2) {
            setCombo(comboCountRef.current);
            triggerComboAnim();
        }

        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => {
            comboCountRef.current = 0;
            setCombo(0);
        }, COMBO_RESET_MS);

        boomBox(box.id);
        countRef.current += 1;
        setCount(c => c + 1);
        setLevelCount(c => c + 1);
    }

    function levelUp() {
        saveCoinStorage();
        durationRef.current += DURATION_STEP;
        levelRef.current += 1;
        setLevel(levelRef.current);

        if (levelRef.current % 10 === 0) {
            const newBombs = bombCountRef.current + 1;
            bombCountRef.current = newBombs;
            setBombCount(newBombs);
            saveBombCount(newBombs);
        }

        setBoxesData(prev => prev.map(b => ({...b, duration: durationRef.current})));
    }

    // ─── Effects ──────────────────────────────────────────────────────────────

    useFocusEffect(
        useCallback(() => {
            releaseMusic();
            loadSettings();

            loadBombCount();
            const loadTimeout = setTimeout(() => loadMusic('games1.mp3'), 100);
            const playTimeout = setTimeout(() => playMusic(), 300);

            return () => {
                clearTimeout(loadTimeout);
                clearTimeout(playTimeout);
                pauceMusic();
                musicJumpingRef.current?.release();
                musicPopRef.current?.release();
            };
        }, [])
    );

    useEffect(() => {
        const jumping = new Sound('jumping.wav', Sound.MAIN_BUNDLE, error => {
            if (error) console.log('Failed to load jump sound:', error);
        });
        musicJumpingRef.current = jumping;

        const pop = new Sound('pop.wav', Sound.MAIN_BUNDLE, error => {
            if (error) console.log('Failed to load pop sound:', error);
        });
        musicPopRef.current = pop;

        return () => {
            jumping.release();
            pop.release();
        };
    }, []);

    useEffect(() => {
        if (levelCount >= LEVEL_LENGTH) {
            setLevelCount(0);
            levelUp();
        }
    }, [levelCount]);

    useEffect(() => {
        if (emptyHeartCount >= HEARTS_LENGTH) gameOver();
    }, [emptyHeartCount]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const animate = () => {
            setBoxesData(prev =>
                prev.map((b: any) => {
                    if (b.isBoom) return b;

                    const newX = b.x + (b.tx - b.x) * 0.05;
                    const newY = b.y + (b.ty - b.y) * 0.05;

                    if (newY + b.size > height) {
                        if (!cancelVibrationRef.current) Vibration.vibrate(500);
                        setEmptyHeartCount(prev => prev + 1);

                        return {
                            ...b,
                            x: Math.random() * (width - b.size),
                            y: -Math.random() * 500,
                            tx: Math.random() * (width - b.size),
                            ty: durationRef.current + 10,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            rotation: b.isRotation ? (b.rotation + 2) % 360 : b.rotation,
                        };
                    }

                    return {
                        ...b,
                        x: newX,
                        y: newY,
                        tx: Math.abs(b.tx - b.x) < 1 ? Math.random() * (width - b.size) : b.tx,
                        ty: b.y + durationRef.current + 10,
                        rotation: b.isRotation ? (b.rotation + 2) % 360 : b.rotation,
                    };
                })
            );

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    // Spawn new boxes
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setBoxesData(prev => {
                if (prev.length >= MAX_ITEMS) return prev;
                return [
                    ...prev,
                    {
                        ...card,
                        id: uuId.v4(),
                        x: Math.random() * (width - card.size),
                        y: Math.random() * -1000,
                        tx: Math.random() * (width - card.size),
                        ty: 0,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        duration: durationRef.current,
                        isBoom: false,
                    },
                ];
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    // ─── Render ───────────────────────────────────────────────────────────────

    const comboLabel =
        combo >= 5 ? '🔥 INSANE!' :
        combo >= 4 ? '💥 MEGA!' :
        combo >= 3 ? '⚡ COMBO x' + combo :
                     '✨ COMBO x' + combo;

    const gameContent = (
        <>
            <View style={styles.zIndexStyle}>
                <Level level={level}/>
            </View>

            <View style={styles.zIndexStyle}>
                <Progress length={LEVEL_LENGTH} coin={levelCount}/>
            </View>

            <View style={[styles.headerLeftView, {top: insets.top, zIndex: 2}]}>
                <TouchableOpacity onPress={backHandler}>
                    <Back color={GRADIENT_LIGHT}/>
                </TouchableOpacity>
                <Hearts length={HEARTS_LENGTH} emptyCount={emptyHeartCount}/>
            </View>

            <View style={styles.zIndexStyle}>
                <CoinCount count={count} viewStyles={[styles.countView, {top: insets.top}]}/>
            </View>

            {/* Combo overlay */}
            {combo >= 2 && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.comboOverlay,
                        {
                            opacity: comboOpacityAnim,
                            transform: [{scale: comboScaleAnim}],
                        },
                    ]}
                >
                    <Text style={styles.comboText}>{comboLabel}</Text>
                </Animated.View>
            )}

            {/* Bomb button */}
            <Animated.View
                style={[
                    styles.bombWrapper,
                    {bottom: insets.bottom + 28, transform: [{scale: bombCount > 0 ? bombPulseAnim : 1}]},
                ]}
            >
                <TouchableOpacity
                    onPress={handleBomb}
                    disabled={bombCount <= 0 || !isPlaying}
                    activeOpacity={0.75}
                    style={[styles.bombButton, bombCount <= 0 && styles.bombButtonDisabled]}
                >
                    <BombCard width={34} height={34}/>
                    <View style={styles.bombBadge}>
                        <Text style={styles.bombBadgeText}>{bombCount}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Bomb flash overlay */}
            <Animated.View
                pointerEvents="none"
                style={[styles.flashOverlay, {opacity: bombFlashAnim}]}
            />

            <LoseModal
                visible={isLoseModal}
                score={count}
                onRetry={handleRetry}
                onBack={handleExitConfirm}
                onWatchAd={handleWatchAd}
                canWatchAd={watchAdUsed < 2}
            />
            <ExitModal visible={isExitModal} onConfirm={handleExitConfirm} onCancel={handleExitCancel}/>

            {boxesData
                .slice()
                .reverse()
                .map(box => (
                    <PlayBox key={box.id} box={box} handlePress={() => handleTap(box)}/>
                ))}
        </>
    );

    if (background?.colors?.length) {
        return (
            <View style={[styles.container, {backgroundColor: background.colors[levelIndex]}]}>
                {gameContent}
            </View>
        );
    }

    return (
        // @ts-ignore
        <ImageBackground
            source={background?.images?.[levelIndex] ?? getDefaultBackground(level)}
            style={styles.container}
        >
            {gameContent}
        </ImageBackground>
    );
}
