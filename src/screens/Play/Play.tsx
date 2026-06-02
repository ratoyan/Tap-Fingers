import React, {useCallback, useEffect, useRef, useState} from 'react';
import Sound from 'react-native-sound';
import LinearGradient from 'react-native-linear-gradient';
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
import {useAuthStore} from '../../store/authStore.ts';
import * as gameService from '../../services/gameService.ts';
import * as userService from '../../services/userService.ts';
import * as shopService from '../../services/shopService.ts';
import {registerShopIcons, resolveCardEntry} from '../../data/shopVisuals.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuId from 'react-native-uuid';
import useMusicAppState from '../../hooks/useMusicAppState.tsx';

// icons
import Back from '../../assets/icons/Back.tsx';
import MenuIcon from '../../assets/icons/MenuIcon.tsx';
import BombCard from '../../assets/icons/BombCard.tsx';
import ShieldIcon from '../../assets/icons/ShieldIcon.tsx';
import SlowIcon from '../../assets/icons/SlowIcon.tsx';
import FlameIcon from '../../assets/icons/FlameIcon.tsx';
import BoltIcon from '../../assets/icons/BoltIcon.tsx';
import StarBurstIcon from '../../assets/icons/StarBurstIcon.tsx';

// components
import AnimatedBackground from '../../components/ui/Play/AnimatedBackground.tsx';
import BossBox, {getBossTier} from '../../components/ui/Play/BossBox.tsx';
import CoinCount from '../../components/ui/CoinCount/CoinCount.tsx';
import PlayBox from '../../components/ui/Play/PlayBox.tsx';
import Hearts from '../../components/ui/Play/Hearts.tsx';
import LoseModal from '../../components/ui/Play/LoseModal.tsx';
import ExitModal from '../../components/ui/Play/ExitModal.tsx';
import BuyHelperModal, {HelperType, HELPER_CONFIGS} from '../../components/ui/Play/BuyHelperModal.tsx';
import Level from '../../components/ui/Play/Level.tsx';
import Progress from '../../components/ui/Play/Progress.tsx';
import GameMenuModal from '../../components/ui/Play/GameMenuModal.tsx';

// store
import {useGlobalStore} from '../../store/globalStore.ts';
import {useConfigStore} from '../../store/configStore.ts';

// styles
import styles from './Play.style.ts';
import {GRADIENT_LIGHT, LILAC, ORANGE, ORANGE_RED} from '../../constants/colors.ts';

const {width, height} = Dimensions.get('window');

const HEARTS_LENGTH = 7;
const MAX_ITEMS = 3;
const INITIAL_DURATION = 20;
const DURATION_STEP = 20;
const INITIAL_BOMBS = 0;
const COMBO_WINDOW_MS = 550;
const COMBO_RESET_MS = 850;
const GOLDEN_SPAWN_CHANCE = 0.13;

function getDefaultBackground(level: number) {
    if (level > 4) return require('../../assets/images/background4.jpg');
    if (level > 3) return require('../../assets/images/background3.jpg');
    if (level > 2) return require('../../assets/images/background2.jpg');
    return require('../../assets/images/background1.jpg');
}

function createBoxes(card: any, duration: number) {
    return Array.from({length: MAX_ITEMS}, (_, i) => ({
        ...card,
        id: uuId.v4(),
        x: Math.random() * (width - card.size),
        y: -(i * 280 + Math.random() * 80),
        tx: Math.random() * (width - card.size),
        ty: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration,
        // Seed the spin angle (same reason as spawnBox) so the very first batch
        // of boxes rotates from the start instead of staying NaN until respawn.
        rotation: 0,
        isBoom: false,
        isGolden: false,
    }));
}

function spawnBox(card: any, duration: number) {
    const isGolden = Math.random() < GOLDEN_SPAWN_CHANCE;
    return {
        ...card,
        id: uuId.v4(),
        x: Math.random() * (width - card.size),
        y: Math.random() * -1000,
        tx: Math.random() * (width - card.size),
        ty: 0,
        color: isGolden ? '#FFD700' : colors[Math.floor(Math.random() * colors.length)],
        duration,
        // Seed the spin angle so the per-frame increment in the animation loop
        // has a numeric base to grow from (cards flagged isRotation by the admin
        // or their on-device visual). Without this it starts as NaN and never spins.
        rotation: 0,
        isBoom: false,
        isGolden,
    };
}

export default function Play() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const storeCard = useShopStore(s => s.card);
    const background = useShopStore(s => s.background);
    // shopStore.card is hydrated from the server profile; guard against the
    // brief window before that resolves so box spawning never sees a null card.
    const card = storeCard ?? resolveCardEntry(null);
    // Continuously-spawned boxes read the card through this ref so the spawn
    // loop (whose effect deps don't include `card`) always uses the latest art.
    const cardRef = useRef(card);
    cardRef.current = card;
    const {coins, addCoins} = useGlobalStore();
    const levelLength = useConfigStore(s => s.levelLength);
    const setLevelLength = useConfigStore(s => s.setLevelLength);
    const patchStats = useAuthStore(s => s.patchStats);

    // ─── Refs ─────────────────────────────────────────────────────────────────
    const cancelSoundRef = useRef(true);
    const cancelVibrationRef = useRef(true);
    const durationRef = useRef(INITIAL_DURATION);
    const musicJumpingRef = useRef<Sound | null>(null);
    const musicPopRef = useRef<Sound | null>(null);
    const musicBombRef = useRef<Sound | null>(null);
    const countRef = useRef(0);
    const bombCountRef = useRef(INITIAL_BOMBS);
    const levelRef = useRef(1);
    const watchAdUsedRef = useRef(0);
    const lastTapTimeRef = useRef(0);
    const comboCountRef = useRef(0);
    const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streakRef = useRef(0);
    const missHappenedRef = useRef(false);
    const shieldActiveRef = useRef(false);
    const slowActiveRef = useRef(false);
    const slowSpeedRef = useRef(1);
    const shieldCountRef = useRef(0);
    const slowCountRef = useRef(0);
    const slowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slowTimerValueRef = useRef(0);
    const isBossFightRef = useRef(false);
    const bossHPRef = useRef(0);
    const bossMaxHPRef = useRef(0);
    const bossRewardRef = useRef(0);

    // ─── Backend game-session tracking ────────────────────────────────────────
    const sessionTokenRef = useRef<string | null>(null);
    const sessionStartRef = useRef(0);
    const sessionEndedRef = useRef(false);
    const tapsRef = useRef(0);         // honest tap-gesture count (anti-cheat needs score ≈ taps)
    const maxComboRef = useRef(0);
    // Mirror of emptyHeartCount so the on-exit save (a stale-closure cleanup) and
    // any other ref-based caller read the current lives-lost value.
    const emptyHeartCountRef = useRef(0);

    // ─── Animated values ──────────────────────────────────────────────────────
    const bombFlashAnim = useRef(new Animated.Value(0)).current;
    const shieldFlashAnim = useRef(new Animated.Value(0)).current;
    const slowFlashAnim = useRef(new Animated.Value(0)).current;
    const comboScaleAnim = useRef(new Animated.Value(0)).current;
    const comboOpacityAnim = useRef(new Animated.Value(0)).current;
    const bombPulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const lvlUpOpacityAnim = useRef(new Animated.Value(0)).current;
    const lvlUpScaleAnim = useRef(new Animated.Value(0.5)).current;

    // ─── State ────────────────────────────────────────────────────────────────
    const [count, setCount] = useState(0);
    const [levelCount, setLevelCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoseModal, setIsLoseModal] = useState(false);
    const [isExitModal, setIsExitModal] = useState(false);
    const [isMenuModal, setIsMenuModal] = useState(false);
    const [buyModal, setBuyModal] = useState<HelperType | null>(null);
    const [boxesData, setBoxesData] = useState(() => createBoxes(card, durationRef.current));
    const [bombCount, setBombCount] = useState(INITIAL_BOMBS);
    const [combo, setCombo] = useState(0);
    const [watchAdUsed, setWatchAdUsed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [shieldCount, setShieldCount] = useState(0);
    const [slowCount, setSlowCount] = useState(0);
    const [shieldActive, setShieldActive] = useState(false);
    const [slowActive, setSlowActive] = useState(false);
    const [slowTimer, setSlowTimer] = useState(0);
    const [isBossFight, setIsBossFight] = useState(false);
    const [bossHP, setBossHP] = useState(0);
    const [bossMaxHP, setBossMaxHP] = useState(0);
    const [showBossDefeated, setShowBossDefeated] = useState(false);

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

    // ─── Backend game session ─────────────────────────────────────────────────

    // Loads the server's helper stock into refs/state, and keeps the local
    // AsyncStorage cache warm for the offline fallback path.
    function applyHelperCounts(bomb: number, slow: number, shield: number) {
        bombCountRef.current = bomb;
        slowCountRef.current = slow;
        shieldCountRef.current = shield;
        setBombCount(bomb);
        setSlowCount(slow);
        setShieldCount(shield);
        AsyncStorage.multiSet([
            [STORAGE_KEYS.BOMB_COUNT, JSON.stringify(bomb)],
            [STORAGE_KEYS.SLOW_COUNT, JSON.stringify(slow)],
            [STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(shield)],
        ]).catch(() => {});
    }

    async function startGameSession() {
        sessionEndedRef.current = false;
        tapsRef.current = 0;
        maxComboRef.current = 0;
        sessionStartRef.current = Date.now();
        sessionTokenRef.current = null;
        setLevelLength(1);

        try {
            // The token returned here is what lets submitGameSession() report the
            // run and bank the earned coins on /game/end.
            const session = await gameService.startSession();
            sessionTokenRef.current = session.sessionToken;
            applyHelperCounts(session.helpers.bomb, session.helpers.slow, session.helpers.shield);
        } catch {
            // Offline / start failed — fall back to the locally cached helper
            // stock. The run still plays; it just can't be banked server-side.
            loadBombCount();
            loadHelperCounts();
        }
    }

    // Submits the finished run to /game/end. Captures everything synchronously
    // so it is safe to call immediately before startGameSession() resets the refs.
    function submitGameSession() {
        if (sessionEndedRef.current) return;
        sessionEndedRef.current = true;

        const token = sessionTokenRef.current;
        const taps = tapsRef.current;
        const maxCombo = maxComboRef.current;
        const livesLost = Math.min(7, emptyHeartCountRef.current);
        const durationSecs = Math.max(
            5,
            Math.min(600, Math.round((Date.now() - sessionStartRef.current) / 1000)),
        );

        // Final device-side helper stock — server stores this snapshot.
        const bombCountFinal   = bombCountRef.current;
        const slowCountFinal   = slowCountRef.current;
        const shieldCountFinal = shieldCountRef.current;

        // Nothing to report: no server session, or the player never tapped.
        if (!token || taps <= 0) return;

        // Anti-cheat requires score ≈ taps, so submit the honest tap count for both.
        gameService
            .endSession({
                sessionToken: token,
                score: taps,
                taps,
                durationSecs,
                livesLost,
                maxCombo,
                bombCount: bombCountFinal,
                slowCount: slowCountFinal,
                shieldCount: shieldCountFinal,
            })
            .then(result => patchStats({coins: result.totalCoins}))
            .catch(() => {
                // Rejected by anti-cheat or a network error — coins simply won't
                // update for this round; the next profile refresh reconciles.
            });
    }

    // ─── Storage helpers ──────────────────────────────────────────────────────
    async function loadSettings() {
        const s = await AsyncStorage.getItem(STORAGE_KEYS.SOUND);
        const v = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION);
        cancelSoundRef.current = !!s;
        cancelVibrationRef.current = !!v;
    }

    function handleWatchAdHelper(type: HelperType) {
        if (watchAdUsedRef.current >= 2) return;
        watchAdUsedRef.current += 1;
        setWatchAdUsed(watchAdUsedRef.current);
        if (type === 'bomb') {
            const n = bombCountRef.current + 1;
            bombCountRef.current = n;
            setBombCount(n);
            saveBombCount(n);
        } else if (type === 'shield') {
            const n = shieldCountRef.current + 1;
            shieldCountRef.current = n;
            setShieldCount(n);
            saveShieldCount(n);
        } else if (type === 'slow') {
            const n = slowCountRef.current + 1;
            slowCountRef.current = n;
            setSlowCount(n);
            saveSlowCount(n);
        }
        setBuyModal(null);
        setIsPlaying(true);
    }

    async function handleBuyHelper(type: HelperType) {
        const {price} = HELPER_CONFIGS[type];
        if (coins < price) return;
        try {
            // Server validates the balance, charges the coins and returns the new total.
            const result = await userService.purchaseHelper(type);
            patchStats({coins: result.remainingCoins});
        } catch {
            // Rejected server-side (insufficient coins) or offline — don't grant.
            return;
        }
        if (type === 'bomb') {
            const n = bombCountRef.current + 1;
            bombCountRef.current = n;
            setBombCount(n);
            saveBombCount(n);
        } else if (type === 'shield') {
            const n = shieldCountRef.current + 1;
            shieldCountRef.current = n;
            setShieldCount(n);
            saveShieldCount(n);
        } else if (type === 'slow') {
            const n = slowCountRef.current + 1;
            slowCountRef.current = n;
            setSlowCount(n);
            saveSlowCount(n);
        }
        setBuyModal(null);
        setIsPlaying(true);
    }

    async function loadBombCount() {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOMB_COUNT);
        const saved = stored ? JSON.parse(stored) : INITIAL_BOMBS;
        const value = Math.max(saved, INITIAL_BOMBS);
        bombCountRef.current = value;
        setBombCount(value);
    }

    async function saveBombCount(n: number) {
        await AsyncStorage.setItem(STORAGE_KEYS.BOMB_COUNT, JSON.stringify(n));
    }

    async function loadHelperCounts() {
        const slow = await AsyncStorage.getItem(STORAGE_KEYS.SLOW_COUNT);
        const shield = await AsyncStorage.getItem(STORAGE_KEYS.SHIELD_COUNT);
        const s = slow ? JSON.parse(slow) : 0;
        const h = shield ? JSON.parse(shield) : 0;
        slowCountRef.current = s;
        shieldCountRef.current = h;
        setSlowCount(s);
        setShieldCount(h);
    }

    async function saveSlowCount(n: number) {
        await AsyncStorage.setItem(STORAGE_KEYS.SLOW_COUNT, JSON.stringify(n));
    }

    async function saveShieldCount(n: number) {
        await AsyncStorage.setItem(STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(n));
    }

    // ─── Animations ───────────────────────────────────────────────────────────
    function triggerMissShake() {
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 9, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -9, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 5, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
        ]).start();
    }

    function triggerLevelUp(newLevel: number) {
        setShowLevelUp(true);
        lvlUpOpacityAnim.setValue(1);
        lvlUpScaleAnim.setValue(0.4);
        Animated.parallel([
            Animated.spring(lvlUpScaleAnim, {toValue: 1, useNativeDriver: true, friction: 4}),
            Animated.sequence([
                Animated.delay(1100),
                Animated.timing(lvlUpOpacityAnim, {toValue: 0, duration: 400, useNativeDriver: true}),
            ]),
        ]).start(() => setShowLevelUp(false));
    }

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

    // ─── Game actions ─────────────────────────────────────────────────────────

    function menuHandler() {
        if (isLoseModal || isExitModal || buyModal !== null) return;
        setIsPlaying(false);
        setIsMenuModal(true);
    }

    function handleMenuClose() {
        setIsMenuModal(false);
        setIsPlaying(true);
    }

    function handleMenuExit() {
        setIsMenuModal(false);
        setIsExitModal(true);
    }

    function handleExitConfirm() {
        submitGameSession();
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
        setEmptyHeartCount(prev => Math.max(0, prev - 1));
        setIsLoseModal(false);
        setIsPlaying(true);
        setBoxesData([]);
        setTimeout(() => setBoxesData(createBoxes(card, durationRef.current)), 0);
    }

    function handleRetry() {
        submitGameSession();
        durationRef.current = INITIAL_DURATION;
        countRef.current = 0;
        bombCountRef.current = INITIAL_BOMBS;
        levelRef.current = 1;
        comboCountRef.current = 0;
        streakRef.current = 0;
        shieldActiveRef.current = false;
        slowActiveRef.current = false;
        slowSpeedRef.current = 1;
        watchAdUsedRef.current = 0;
        isBossFightRef.current = false;
        bossHPRef.current = 0;
        bossMaxHPRef.current = 0;
        setCount(0);
        setLevelCount(0);
        setLevel(1);
        setEmptyHeartCount(0);
        setBombCount(INITIAL_BOMBS);
        setCombo(0);
        setShieldActive(false);
        setSlowActive(false);
        setWatchAdUsed(0);
        setIsBossFight(false);
        setBossHP(0);
        setBossMaxHP(0);
        setShowBossDefeated(false);
        setIsPlaying(true);
        setIsLoseModal(false);
        setBoxesData(createBoxes(card, durationRef.current));
        // startGameSession() reloads the helper stock from the server (with an
        // offline AsyncStorage fallback).
        startGameSession();
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

        tapsRef.current += 1;
        streakRef.current = 0;

        if (!cancelSoundRef.current && musicBombRef.current) {
            musicBombRef.current.setCurrentTime(0);
            musicBombRef.current.play();
        }

        if (!cancelVibrationRef.current) Vibration.vibrate([0, 80, 60, 80]);

        bombFlashAnim.setValue(1);
        Animated.timing(bombFlashAnim, {toValue: 0, duration: 700, useNativeDriver: true}).start();

        setBoxesData(prev => {
            const activeCount = prev.filter(b => !b.isBoom).length;
            const pts = activeCount;
            countRef.current += pts;
            setCount(c => c + pts);
            setLevelCount(c => c + pts);
            return [];
        });
        setTimeout(() => setBoxesData(createBoxes(card, durationRef.current)), 150);
    }

    // ─── Shield helper ───────────────────────────────────────────────────────
    function handleShield() {
        if (shieldCountRef.current <= 0 || !isPlaying || shieldActiveRef.current) return;

        shieldCountRef.current -= 1;
        setShieldCount(shieldCountRef.current);
        saveShieldCount(shieldCountRef.current);
        shieldActiveRef.current = true;
        setShieldActive(true);

        if (!cancelSoundRef.current && musicJumpingRef.current) {
            musicJumpingRef.current.setSpeed(1.6);
            musicJumpingRef.current.setCurrentTime(0);
            musicJumpingRef.current.play();
        }

        shieldFlashAnim.setValue(1);
        Animated.timing(shieldFlashAnim, {toValue: 0, duration: 600, useNativeDriver: true}).start();

        if (!cancelVibrationRef.current) Vibration.vibrate(120);
    }

    // ─── Slow Mo helper ───────────────────────────────────────────────────────
    function handleSlow() {
        if (slowCountRef.current <= 0 || !isPlaying || slowActiveRef.current) return;

        slowCountRef.current -= 1;
        setSlowCount(slowCountRef.current);
        saveSlowCount(slowCountRef.current);
        slowActiveRef.current = true;
        slowSpeedRef.current = 0.25;
        setSlowActive(true);

        if (!cancelSoundRef.current && musicBombRef.current) {
            musicBombRef.current.setSpeed(0.5);
            musicBombRef.current.setCurrentTime(0);
            musicBombRef.current.play();
        }

        slowFlashAnim.setValue(1);
        Animated.timing(slowFlashAnim, {toValue: 0, duration: 800, useNativeDriver: true}).start();

        if (!cancelVibrationRef.current) Vibration.vibrate([0, 60, 40, 60]);

        const SLOW_DURATION = 8;
        slowTimerValueRef.current = SLOW_DURATION;
        setSlowTimer(SLOW_DURATION);
        startSlowInterval();
    }

    function startSlowInterval() {
        if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
        slowIntervalRef.current = setInterval(() => {
            setSlowTimer(t => {
                const next = t - 1;
                slowTimerValueRef.current = next;
                if (next <= 0) {
                    clearInterval(slowIntervalRef.current!);
                    slowIntervalRef.current = null;
                    slowActiveRef.current = false;
                    slowSpeedRef.current = 1;
                    setSlowActive(false);
                    return 0;
                }
                return next;
            });
        }, 1000);
    }

    // ─── Boss fight ───────────────────────────────────────────────────────────
    function startBossFight(lvl: number) {
        const maxHP = 10 + Math.floor(lvl / 10) * 10;
        bossHPRef.current = maxHP;
        bossMaxHPRef.current = maxHP;
        bossRewardRef.current = Math.floor(lvl / 10) * 5;
        isBossFightRef.current = true;
        setBossHP(maxHP);
        setBossMaxHP(maxHP);
        setIsBossFight(true);
        setBoxesData([]);
    }

    function handleBossTap() {
        if (!isPlaying || !isBossFightRef.current) return;
        const newHP = bossHPRef.current - 1;
        bossHPRef.current = newHP;
        setBossHP(newHP);

        countRef.current += 1;
        setCount(c => c + 1);
        tapsRef.current += 1;

        if (!cancelSoundRef.current && musicJumpingRef.current) {
            musicJumpingRef.current.setSpeed(0.3 + Math.random() * 0.15);
            musicJumpingRef.current.setCurrentTime(0);
            musicJumpingRef.current.play();
        }
        if (!cancelVibrationRef.current) Vibration.vibrate(25);

        if (newHP <= 0) endBossFight();
    }

    function endBossFight() {
        // keep isBossFightRef true while the overlay shows — blocks box spawning & animation
        setIsBossFight(false);
        setShowBossDefeated(true);

        const reward = bossRewardRef.current;
        countRef.current += reward;
        setCount(c => c + reward);
        // Optimistic only — the boss bonus isn't part of the server score model.
        addCoins(reward);

        setEmptyHeartCount(prev => Math.max(0, prev - 1));

        setTimeout(() => {
            isBossFightRef.current = false;
            setShowBossDefeated(false);
            setBoxesData(createBoxes(card, durationRef.current));
        }, 2500);
    }

    // ─── Tap handler ─────────────────────────────────────────────────────────
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

        // Streak + honest tap count for the backend session
        streakRef.current += 1;
        tapsRef.current += 1;

        // Combo
        const now = Date.now();
        if (now - lastTapTimeRef.current < COMBO_WINDOW_MS) {
            comboCountRef.current += 1;
        } else {
            comboCountRef.current = 1;
        }
        lastTapTimeRef.current = now;
        if (comboCountRef.current > maxComboRef.current) {
            maxComboRef.current = comboCountRef.current;
        }

        if (comboCountRef.current >= 2) {
            setCombo(comboCountRef.current);
            triggerComboAnim();
        }

        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => {
            comboCountRef.current = 0;
            setCombo(0);
        }, COMBO_RESET_MS);

        // Points: golden = 3 base, normal = 1, both × streak multiplier
        const pts = box.isGolden ? 3 : 1;

        boomBox(box.id);
        countRef.current += pts;
        setCount(c => c + pts);
        setLevelCount(c => c + pts);
    }

    function levelUp() {
        durationRef.current += DURATION_STEP;
        levelRef.current += 1;
        setLevel(levelRef.current);
        triggerLevelUp(levelRef.current);

        if (levelRef.current % 10 === 0) {
            const newBombs = bombCountRef.current + 1;
            bombCountRef.current = newBombs;
            setBombCount(newBombs);
            saveBombCount(newBombs);
            setTimeout(() => startBossFight(levelRef.current), 2000);
        }

        if (levelRef.current % 15 === 0) {
            const newSlow = slowCountRef.current + 1;
            slowCountRef.current = newSlow;
            setSlowCount(newSlow);
            saveSlowCount(newSlow);
        }

        if (levelRef.current % 20 === 0) {
            const newShield = shieldCountRef.current + 1;
            shieldCountRef.current = newShield;
            setShieldCount(newShield);
            saveShieldCount(newShield);
        }

        setBoxesData(prev => prev.map(b => ({...b, duration: durationRef.current})));
    }

    // ─── App state (background → auto-pause & open menu) ─────────────────────
    const onAppBackground = useCallback(() => {
        if (isLoseModal || isExitModal || buyModal !== null) return;
        setIsPlaying(false);
        setIsMenuModal(true);
    }, [isLoseModal, isExitModal, buyModal]);

    useMusicAppState(playMusic, pauceMusic, onAppBackground);

    // ─── Effects ──────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            releaseMusic();
            loadSettings();
            // startGameSession() loads the helper stock from the server, with
            // an AsyncStorage fallback (loadBombCount/loadHelperCounts) on error.
            startGameSession();

            // Fetch the latest card art and refresh the equipped card so the
            // falling boxes render the admin SVG (best-effort — falls back to
            // the bundled component if the catalog can't be reached).
            shopService.getItems()
                .then(items => {
                    registerShopIcons(items);
                    const key = useAuthStore.getState().stats?.activeCardKey;
                    useShopStore.getState().setCard(resolveCardEntry(key));
                })
                .catch(() => {});

            const loadTimeout = setTimeout(() => loadMusic('games1.mp3'), 100);
            const playTimeout = setTimeout(() => playMusic(), 300);

            return () => {
                // Force-save: whatever path the player took out of Play (hardware
                // back, swipe gesture, navigation away, unmount), bank the run.
                // Idempotent via sessionEndedRef, so the exit-modal/retry paths
                // that already submitted won't double-report.
                submitGameSession();
                clearTimeout(loadTimeout);
                clearTimeout(playTimeout);
                pauceMusic();
                musicJumpingRef.current?.release();
                musicPopRef.current?.release();
            };
        }, [])
    );

    useEffect(() => {
        const jumping = new Sound('jumping.wav', Sound.MAIN_BUNDLE, e => {
            if (e) console.log('jump sound error:', e);
        });
        musicJumpingRef.current = jumping;

        const pop = new Sound('pop.wav', Sound.MAIN_BUNDLE, e => {
            if (e) console.log('pop sound error:', e);
        });
        musicPopRef.current = pop;

        const bomb = new Sound('jumping.wav', Sound.MAIN_BUNDLE, e => {
            if (e) console.log('bomb sound error:', e);
            else bomb.setSpeed(0.25);
        });
        musicBombRef.current = bomb;

        return () => {
            jumping.release();
            pop.release();
            bomb.release();
            if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (levelCount >= levelLength) {
            setLevelCount(0);
            levelUp();
        }
    }, [levelCount, levelLength]);

    useEffect(() => {
        emptyHeartCountRef.current = emptyHeartCount;
        if (emptyHeartCount >= HEARTS_LENGTH) gameOver();
    }, [emptyHeartCount]);

    // When the equipped card's admin art resolves (async catalog fetch), patch
    // the boxes already on screen in place — SVG, its render width/height, and
    // the colour flags — so they pick up the admin art/size without repositioning
    // or a fallback flash. randomColors/trackColor are included so the initial
    // boxes (created before the catalog fetch finished) actually render in random
    // colours instead of the SVG's authored colour.
    useEffect(() => {
        setBoxesData(prev => prev.map(b => (
            b.isBoom ? b : {
                ...b,
                iconSvg: card.iconSvg,
                width: card.width,
                height: card.height,
                randomColors: card.randomColors,
                isRotation: card.isRotation,
                trackColor: card.trackColor,
            }
        )));
    }, [card.iconSvg, card.width, card.height, card.randomColors, card.isRotation, card.trackColor]);

    useEffect(() => {
        if (!isPlaying) {
            if (slowIntervalRef.current) {
                clearInterval(slowIntervalRef.current);
                slowIntervalRef.current = null;
            }
        } else if (slowActiveRef.current && slowTimerValueRef.current > 0) {
            startSlowInterval();
        }
    }, [isPlaying]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;

        const animate = () => {
            if (isBossFightRef.current) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            missHappenedRef.current = false;

            setBoxesData(prev =>
                prev.map((b: any) => {
                    if (b.isBoom) return b;

                    const speed = 0.05 * slowSpeedRef.current;
                    const newX = b.x + (b.tx - b.x) * speed;
                    const newY = b.y + (b.ty - b.y) * speed;

                    if (newY + b.size > height) {
                        if (shieldActiveRef.current) {
                            shieldActiveRef.current = false;
                            setShieldActive(false);
                        } else {
                            if (!cancelVibrationRef.current) Vibration.vibrate(500);
                            setEmptyHeartCount(prev => prev + 1);
                        }
                        missHappenedRef.current = true;

                        return {
                            ...b,
                            x: Math.random() * (width - b.size),
                            y: -Math.random() * 500,
                            tx: Math.random() * (width - b.size),
                            ty: durationRef.current + 10,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            rotation: b.isRotation ? (b.rotation + 2) % 360 : b.rotation,
                            isGolden: false,
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

            if (missHappenedRef.current) {
                streakRef.current = 0;
                triggerMissShake();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    // Spawn new boxes
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            if (isBossFightRef.current) return;
            setBoxesData(prev => {
                const slots = MAX_ITEMS - prev.length;
                if (slots <= 0) return prev;
                const toSpawn = Math.min(slots, Math.random() < 0.35 ? 2 : 1);
                return [...prev, ...Array.from({length: toSpawn}, () => spawnBox(cardRef.current, durationRef.current))];
            });
        }, 800);

        return () => clearInterval(interval);
    }, [isPlaying]);

    // ─── Render helpers ───────────────────────────────────────────────────────
    const comboLabel =
        combo >= 5 ? '🔥 INSANE!' :
            combo >= 4 ? '💥 MEGA!' :
                combo >= 3 ? '⚡ COMBO x' + combo :
                    '✨ COMBO x' + combo;


    const LevelUpIcon = level >= 10 ? FlameIcon : level >= 5 ? BoltIcon : StarBurstIcon;
    const levelUpColor = level >= 10 ? '#FF6B00' : level >= 5 ? '#FFD700' : '#ffffff';

    // ─── Game content ─────────────────────────────────────────────────────────
    const gameContent = (
        <Animated.View style={[styles.container, {transform: [{translateX: shakeAnim}]}]}>
            <View style={styles.zIndexStyle}>
                <Level level={level}/>
            </View>

            <View style={styles.zIndexStyle}>
                <Progress length={levelLength} coin={levelCount}/>
            </View>


            <View style={[styles.headerLeftView, {top: insets.top, zIndex: 2}]}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={menuHandler} style={styles.menuBtn}>
                        <MenuIcon size={18} color="#fff"/>
                    </TouchableOpacity>
                </View>
                <View style={styles.heartsWrapper}>
                    <Hearts length={HEARTS_LENGTH} emptyCount={emptyHeartCount}/>
                </View>
            </View>

            <View style={styles.zIndexStyle}>
                <CoinCount count={count} viewStyles={[styles.countView, {top: insets.top}]}/>
            </View>


            {/* Combo overlay */}
            {combo >= 2 && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.comboOverlay, {
                        opacity: comboOpacityAnim,
                        transform: [{scale: comboScaleAnim}],
                    }]}
                >
                    <Text allowFontScaling={false} style={styles.comboText}>{comboLabel}</Text>
                </Animated.View>
            )}

            {/* Level up overlay */}
            {showLevelUp && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.levelUpOverlay, {
                        opacity: lvlUpOpacityAnim,
                        transform: [{scale: lvlUpScaleAnim}],
                    }]}
                >
                    <LevelUpIcon size={56}/>
                    <Text allowFontScaling={false} style={[styles.levelUpText, {color: levelUpColor}]}>
                        LEVEL {level}!
                    </Text>
                </Animated.View>
            )}

            {/* Boss fight banner */}
            {isBossFight && (
                <View pointerEvents="none" style={styles.bossFightBanner}>
                    <Text allowFontScaling={false} style={styles.bossFightText}>
                        ⚔️ BOSS FIGHT ⚔️
                    </Text>
                    <Text allowFontScaling={false} style={styles.bossFightSub}>
                        {getBossTier(level).name} • TAP TO DESTROY
                    </Text>
                </View>
            )}

            {/* Boss */}
            {isBossFight && (
                <BossBox
                    bossHP={bossHP}
                    bossMaxHP={bossMaxHP}
                    level={level}
                    onTap={handleBossTap}
                />
            )}

            {/* Boss defeated overlay */}
            {showBossDefeated && (
                <View style={styles.bossDefeatedOverlay}>
                    <Text allowFontScaling={false} style={styles.bossDefeatedEmoji}>🏆</Text>
                    <Text allowFontScaling={false} style={styles.bossDefeatedText}>
                        {getBossTier(level).name} DEFEATED!
                    </Text>
                    <Text allowFontScaling={false} style={styles.bossDefeatedReward}>
                        +{bossRewardRef.current} coins • ❤️ restored
                    </Text>
                </View>
            )}

            {/* Helpers row */}
            <View style={[styles.helpersRow, {bottom: insets.bottom + 22}, isBossFight && {opacity: 0.3, pointerEvents: 'none'}]}>

                {/* Shield */}
                <Animated.View style={{transform: [{scale: shieldCount > 0 && !shieldActive ? bombPulseAnim : 1}]}}>
                    <TouchableOpacity
                        onPress={() => {
                            if (shieldCount > 0 && !shieldActive) {
                                handleShield();
                            } else if (!shieldActive) {
                                setIsPlaying(false);
                                setBuyModal('shield');
                            }
                        }}
                        disabled={shieldActive}
                        activeOpacity={0.75}
                        style={[
                            styles.helperButton,
                            {borderColor: shieldActive ? '#00e5ff' : shieldCount > 0 ? '#4fc3f7' : '#1a5276'},
                            shieldActive && styles.helperButtonDisabled,
                        ]}
                    >
                        <ShieldIcon size={28} color={shieldActive ? '#00e5ff' : shieldCount > 0 ? '#fff' : '#4fc3f7'}/>
                        <View style={[styles.helperBadge, {backgroundColor: shieldCount > 0 ? '#0288d1' : '#1a3a4a'}]}>
                            <Text allowFontScaling={false} style={styles.helperBadgeText}>{shieldCount > 0 ? shieldCount : '+'}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Bomb */}
                <Animated.View style={{transform: [{scale: bombCount > 0 ? bombPulseAnim : 1}]}}>
                    <TouchableOpacity
                        onPress={() => {
                            if (bombCount > 0) {
                                handleBomb();
                            } else {
                                setIsPlaying(false);
                                setBuyModal('bomb');
                            }
                        }}
                        activeOpacity={0.75}
                        style={[
                            styles.helperButton,
                            styles.helperButtonBomb,
                            {borderColor: bombCount > 0 ? ORANGE : '#5a2a1a'},
                        ]}
                    >
                        <BombCard width={32} height={32}/>
                        <View style={[styles.helperBadge, {backgroundColor: bombCount > 0 ? ORANGE_RED : '#3a1a0a'}]}>
                            <Text allowFontScaling={false} style={styles.helperBadgeText}>{bombCount > 0 ? bombCount : '+'}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Slow Mo */}
                <Animated.View style={{transform: [{scale: slowCount > 0 && !slowActive ? bombPulseAnim : 1}]}}>
                    <TouchableOpacity
                        onPress={() => {
                            if (slowCount > 0 && !slowActive) {
                                handleSlow();
                            } else if (!slowActive) {
                                setIsPlaying(false);
                                setBuyModal('slow');
                            }
                        }}
                        disabled={slowActive}
                        activeOpacity={0.75}
                        style={[
                            styles.helperButton,
                            {borderColor: slowActive ? '#b39ddb' : slowCount > 0 ? LILAC : '#4a2060'},
                            slowActive && styles.helperButtonDisabled,
                        ]}
                    >
                        {slowActive ? (
                            <Text allowFontScaling={false} style={styles.slowCountdownText}>{slowTimer}</Text>
                        ) : (
                            <SlowIcon size={28} color={slowCount > 0 ? '#fff' : LILAC}/>
                        )}
                        {!slowActive && (
                            <View
                                style={[styles.helperBadge, {backgroundColor: slowCount > 0 ? '#7b1fa2' : '#2a0a40'}]}>
                                <Text allowFontScaling={false} style={styles.helperBadgeText}>{slowCount > 0 ? slowCount : '+'}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Shield active border */}
            {shieldActive && (
                <View pointerEvents="none" style={styles.shieldBorder}/>
            )}

            {/* Flash overlays */}
            <Animated.View pointerEvents="none"
                           style={[styles.flashOverlay, {opacity: bombFlashAnim, backgroundColor: ORANGE}]}/>
            <Animated.View pointerEvents="none"
                           style={[styles.flashOverlay, {opacity: shieldFlashAnim, backgroundColor: '#00e5ff'}]}/>
            <Animated.View pointerEvents="none"
                           style={[styles.flashOverlay, {opacity: slowFlashAnim, backgroundColor: LILAC}]}/>

            <LoseModal
                visible={isLoseModal}
                score={count}
                onRetry={handleRetry}
                onBack={handleExitConfirm}
                onWatchAd={handleWatchAd}
                canWatchAd={watchAdUsed < 2}
            />
            <ExitModal visible={isExitModal} onConfirm={handleExitConfirm} onCancel={handleExitCancel}/>
            <GameMenuModal visible={isMenuModal} onClose={handleMenuClose} onExit={handleMenuExit}/>
            <BuyHelperModal
                visible={buyModal !== null}
                helperType={buyModal}
                coins={coins}
                watchAdUsed={watchAdUsed}
                onBuy={handleBuyHelper}
                onWatchAd={handleWatchAdHelper}
                onClose={() => {
                    setBuyModal(null);
                    setIsPlaying(true);
                }}
            />

            {boxesData
                .slice()
                .reverse()
                .map(box => (
                    <PlayBox key={box.id} box={box} handlePress={() => handleTap(box)}/>
                ))}
        </Animated.View>
    );

    if (background?.animationType) {
        return (
            <View style={styles.container}>
                <AnimatedBackground type={background.animationType}/>
                {gameContent}
            </View>
        );
    }

    if (background?.colors?.length) {
        return (
            <LinearGradient
                colors={background.colors}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={styles.container}
            >
                {gameContent}
            </LinearGradient>
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
