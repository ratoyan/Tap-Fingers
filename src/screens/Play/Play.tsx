import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Sound from 'react-native-sound';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/core';
import {useTranslation} from 'react-i18next';
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
import {withRetry} from '../../utils/withRetry.ts';
import * as userService from '../../services/userService.ts';
import * as shopService from '../../services/shopService.ts';
import * as bossService from '../../services/bossService.ts';
import {Boss} from '../../services/types.ts';
import {registerShopIcons, resolveCardEntry} from '../../data/shopVisuals.ts';
import {storage} from '../../db/kvStore.ts';
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
// Gap between two consecutive drops. Tightens as the level climbs, and is
// stretched by the slow-mo helper so the stream thins out with the fall speed.
const SPAWN_INTERVAL_MS = 900;
const SPAWN_INTERVAL_MIN_MS = 380;
const SPAWN_INTERVAL_STEP_MS = 45;
const INITIAL_DURATION = 20;
const DURATION_STEP = 20;
const INITIAL_BOMBS = 0;
const COMBO_WINDOW_MS = 550;
const COMBO_RESET_MS = 850;
const GOLDEN_SPAWN_CHANCE = 0.13;
// Hazard bombs fall in with the cards: tapping one costs a heart, letting it
// fall past the edge is free. Every level — the first one included — drops
// exactly BOMBS_PER_LEVEL of them, each after a random gap (never on a
// predictable beat), from their own timer independent of the card spawner.
// They fall a bit quicker than the cards (BOMB_FALL_BOOST× the per-frame reach),
// so they cross the screen faster and give the player less time to hesitate.
const BOMBS_PER_LEVEL = 4;
const BOMB_FALL_BOOST = 1.5;
// Life pickup: every HEART_DROP_EVERY_LEVELS levels the game checks whether the
// player has lost a heart; if so, one heart drops in (a bit quicker than the
// cards). Tapping it gives the lost life back. Nothing drops on a full heart row.
const HEART_DROP_EVERY_LEVELS = 4;
const HEART_FALL_BOOST = 1.4;
const BOMB_GAP_MIN_MS = 1200;
const BOMB_GAP_MAX_MS = 4000;
// Clearing the field (bomb blast, boss defeated) drops the fall duration to this
// fraction of the level's value, then it climbs back linearly over
// DURATION_DIP_RECOVER_MS — the arena restarts gentle and eases back to the
// level's real pace instead of throwing full-speed boxes at a fresh screen.
const DURATION_DIP_FACTOR = 0.4;
const DURATION_DIP_RECOVER_MS = 4000;
// Free helpers (bomb every 10 levels, slow every 15, shield every 20) only start
// dropping once the player reaches this level — the early game is meant to be
// played without them. The boss fight still triggers on its own every 10 levels.
const HELPER_GRANT_MIN_LEVEL = 20;

function getDefaultBackground(level: number) {
    if (level > 4) return require('../../assets/images/background4.jpg');
    if (level > 3) return require('../../assets/images/background3.jpg');
    if (level > 2) return require('../../assets/images/background2.jpg');
    return require('../../assets/images/background1.jpg');
}

function spawnBox(
    card: any,
    duration: number,
    fromBottom = false,
    isBomb = false,
    isHeart = false,
) {
    const isGolden = !isBomb && !isHeart && Math.random() < GOLDEN_SPAWN_CHANCE;
    // Spawn just off the edge the box travels from (below for fromBottom, above
    // otherwise) so it slides into view right away. The spacing between boxes
    // comes from the spawn cadence, not from a random head start off-screen —
    // that is what makes them arrive one after another like falling snow.
    const offset = card.size + Math.random() * 120;
    const y = fromBottom ? height + offset : -offset;
    return {
        ...card,
        id: uuId.v4(),
        x: Math.random() * (width - card.size),
        y,
        tx: Math.random() * (width - card.size),
        // Seed the vertical target in the travel direction so the box drifts on
        // screen smoothly from frame one (a flat 0 would yank a bottom-spawned
        // box upward across the whole screen in a single step).
        ty: fromBottom ? y - (duration + 10) : 0,
        color: isGolden ? '#FFD700' : colors[Math.floor(Math.random() * colors.length)],
        duration,
        // Seed the spin angle so the per-frame increment in the animation loop
        // has a numeric base to grow from (cards flagged isRotation by the admin
        // or their on-device visual). Without this it starts as NaN and never spins.
        rotation: 0,
        isBoom: false,
        isGolden,
        isBomb,
        isHeart,
    };
}

export default function Play() {
    const {t} = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const storeCard = useShopStore(s => s.card);
    const background = useShopStore(s => s.background);
    // shopStore.card is hydrated from the server profile; guard against the
    // brief window before that resolves so box spawning never sees a null card.
    const card = useMemo(() => storeCard ?? resolveCardEntry(null), [storeCard]);
    // Continuously-spawned boxes read the card through this ref so the spawn
    // loop (whose effect deps don't include `card`) always uses the latest art.
    const cardRef = useRef(card);
    cardRef.current = card;
    const coins = useGlobalStore(s => s.coins);
    const addCoins = useGlobalStore(s => s.addCoins);
    // Stable press handler for the memoized PlayBox rows — forwards to the live
    // handleTap (a hoisted function below) without changing identity each render,
    // so falling boxes don't all re-render 60×/sec.
    const handleTapRef = useRef<(box: any) => void>(() => {});
    const onBoxPress = useCallback((box: any) => handleTapRef.current(box), []);
    handleTapRef.current = (box: any) => handleTap(box);
    const levelLength = useConfigStore(s => s.levelLength);
    const setLevelLength = useConfigStore(s => s.setLevelLength);
    const adsEnabled = useConfigStore(s => s.adsEnabled);
    const patchStats = useAuthStore(s => s.patchStats);

    // ─── Refs ─────────────────────────────────────────────────────────────────
    const cancelSoundRef = useRef(true);
    const cancelVibrationRef = useRef(true);
    // durationRef = the level's duration (target). durationEffRef = what the boxes
    // actually travel with right now; a bomb or a boss defeat pulls it down and the
    // animation loop walks it back up to durationRef.
    const durationRef = useRef(INITIAL_DURATION);
    const durationEffRef = useRef(INITIAL_DURATION);
    const lastFrameTsRef = useRef(0);
    const musicJumpingRef = useRef<Sound | null>(null);
    const musicPopRef = useRef<Sound | null>(null);
    const musicBombRef = useRef<Sound | null>(null);
    const countRef = useRef(0);
    const bombCountRef = useRef(INITIAL_BOMBS);
    // Hazard bombs still owed for the current level; refilled to BOMBS_PER_LEVEL
    // on every level-up so each level drops exactly ten of them.
    const bombsLeftRef = useRef(BOMBS_PER_LEVEL);
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
    // The admin-managed boss for the current fight (null → local-tier fallback).
    const bossRef = useRef<Boss | null>(null);
    // Full admin boss catalog, prefetched once on screen focus so each boss
    // fight picks its boss by level instantly — no per-fight network call that
    // could fail/lag and drop the fight to the hardcoded fallback tier.
    const bossListRef = useRef<Boss[]>([]);

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
    // Red screen flash when the player taps a hazard bomb.
    const hurtFlashAnim = useRef(new Animated.Value(0)).current;
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
    // Starts empty — the spawn effect drips the first box in immediately.
    const [boxesData, setBoxesData] = useState<any[]>([]);
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
    const [boss, setBoss] = useState<Boss | null>(null);
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
    // local (Realm) cache warm for the offline fallback path.
    function applyHelperCounts(bomb: number, slow: number, shield: number) {
        bombCountRef.current = bomb;
        slowCountRef.current = slow;
        shieldCountRef.current = shield;
        setBombCount(bomb);
        setSlowCount(slow);
        setShieldCount(shield);
        storage.multiSet([
            [STORAGE_KEYS.BOMB_COUNT, JSON.stringify(bomb)],
            [STORAGE_KEYS.SLOW_COUNT, JSON.stringify(slow)],
            [STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(shield)],
        ]).catch(() => {});
    }

    // Reconciles a single helper count to the server-authoritative value
    // returned by /player/helpers/{use,grant,purchase}.
    function applyServerHelperCount(type: HelperType, count: number) {
        if (type === 'bomb') {
            bombCountRef.current = count; setBombCount(count); saveBombCount(count);
        } else if (type === 'shield') {
            shieldCountRef.current = count; setShieldCount(count); saveShieldCount(count);
        } else if (type === 'slow') {
            slowCountRef.current = count; setSlowCount(count); saveSlowCount(count);
        }
    }

    async function startGameSession() {
        sessionEndedRef.current = false;
        tapsRef.current = 0;
        maxComboRef.current = 0;
        sessionStartRef.current = Date.now();
        sessionTokenRef.current = null;
        setLevelLength(30);

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
        // The on-screen coin counter ("what you see is what you get"): every
        // point — taps, golden boxes, bomb clears, boss rewards — is banked 1:1
        // as coins on /game/end, even when the player quits mid-run. countRef
        // mirrors the live `count` so this stale-closure cleanup reads it too.
        const score = countRef.current;
        const maxCombo = maxComboRef.current;
        const livesLost = Math.min(7, emptyHeartCountRef.current);
        const durationSecs = Math.max(
            5,
            Math.min(600, Math.round((Date.now() - sessionStartRef.current) / 1000)),
        );

        // Nothing to report: no server session, or the player never tapped.
        if (!token || taps <= 0) return;

        // `score` is the real in-game score (≥ taps); `taps` is the honest tap
        // count the server uses for the tap-rate / coin-ceiling anti-cheat.
        // Helper counts are no longer sent — they're updated live via /player/helpers/*.
        // Bank the run through withRetry so a transient Imunify360 bot-protection
        // block on the shared host doesn't silently drop the round's coins. Unlike
        // the auth flow, /game/end had no retry: a single shed request left the
        // session stuck 'active' and the coins lost for good. Idempotent — if the
        // run already banked (response lost, not the request), the retry gets
        // "Session already finalized" and the next profile refresh reconciles.
        withRetry(() =>
            gameService.endSession({
                sessionToken: token,
                score,
                taps,
                durationSecs,
                livesLost,
                maxCombo,
            }),
        )
            .then(result => patchStats({coins: result.totalCoins}))
            .catch(() => {
                // Still failing after retries (anti-cheat rejection or a longer
                // outage) — coins won't update this round; the next profile
                // refresh reconciles.
            });
    }

    // ─── Storage helpers ──────────────────────────────────────────────────────
    async function loadSettings() {
        const s = await storage.getItem(STORAGE_KEYS.SOUND);
        const v = await storage.getItem(STORAGE_KEYS.VIBRATION);
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
        // Persist the free (ad-reward) helper on the server too.
        userService.grantHelper(type).then(r => applyServerHelperCount(type, r.count)).catch(() => {});
        setBuyModal(null);
        setIsPlaying(true);
    }

    async function handleBuyHelper(type: HelperType) {
        const {price} = HELPER_CONFIGS[type];
        if (coins < price) return;
        try {
            // Server charges coins, increments the helper and returns both totals.
            const result = await userService.purchaseHelper(type);
            patchStats({coins: result.remainingCoins});
            applyServerHelperCount(type, result.count);
        } catch {
            // Rejected server-side (insufficient coins) or offline — don't grant.
            return;
        }
        setBuyModal(null);
        setIsPlaying(true);
    }

    async function loadBombCount() {
        const stored = await storage.getItem(STORAGE_KEYS.BOMB_COUNT);
        const saved = stored ? JSON.parse(stored) : INITIAL_BOMBS;
        const value = Math.max(saved, INITIAL_BOMBS);
        bombCountRef.current = value;
        setBombCount(value);
    }

    async function saveBombCount(n: number) {
        await storage.setItem(STORAGE_KEYS.BOMB_COUNT, JSON.stringify(n));
    }

    async function loadHelperCounts() {
        const slow = await storage.getItem(STORAGE_KEYS.SLOW_COUNT);
        const shield = await storage.getItem(STORAGE_KEYS.SHIELD_COUNT);
        const s = slow ? JSON.parse(slow) : 0;
        const h = shield ? JSON.parse(shield) : 0;
        slowCountRef.current = s;
        shieldCountRef.current = h;
        setSlowCount(s);
        setShieldCount(h);
    }

    async function saveSlowCount(n: number) {
        await storage.setItem(STORAGE_KEYS.SLOW_COUNT, JSON.stringify(n));
    }

    async function saveShieldCount(n: number) {
        await storage.setItem(STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(n));
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

        // Revive on a slowed-down field (same dip as a bomb blast / boss defeat):
        // the duration drops and the animation loop walks it back up to the level's
        // value, so the player isn't dropped straight back into full speed.
        durationEffRef.current = durationRef.current * DURATION_DIP_FACTOR;
        lastFrameTsRef.current = 0;
    }

    function handleRetry() {
        submitGameSession();
        durationRef.current = INITIAL_DURATION;
        durationEffRef.current = INITIAL_DURATION;
        countRef.current = 0;
        bombCountRef.current = INITIAL_BOMBS;
        bombsLeftRef.current = BOMBS_PER_LEVEL;
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
        bossRef.current = null;
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
        setBoss(null);
        setShowBossDefeated(false);
        setIsPlaying(true);
        setIsLoseModal(false);
        setBoxesData([]);
        // startGameSession() reloads the helper stock from the server (with an
        // offline local (Realm) fallback).
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
        // Decrement the server stock (authoritative) and reconcile the count.
        userService.useHelper('bomb').then(r => applyServerHelperCount('bomb', r.count)).catch(() => {});

        tapsRef.current += 1;
        streakRef.current = 0;

        // Blast aftermath: the boxes that spawn next travel with a shortened
        // duration (slower fall) and the animation loop lifts it back to the
        // level's duration over the next few seconds.
        durationEffRef.current = durationRef.current * DURATION_DIP_FACTOR;

        if (!cancelSoundRef.current && musicBombRef.current) {
            musicBombRef.current.setCurrentTime(0);
            musicBombRef.current.play();
        }

        if (!cancelVibrationRef.current) Vibration.vibrate([0, 80, 60, 80]);

        bombFlashAnim.setValue(1);
        Animated.timing(bombFlashAnim, {toValue: 0, duration: 700, useNativeDriver: true}).start();

        setBoxesData(prev => {
            // Hazard bombs and the life pickup are wiped by the blast too, but
            // they score nothing — only the real cards on screen pay out.
            const pts = prev.filter(b => !b.isBoom && !b.isBomb && !b.isHeart).length;
            countRef.current += pts;
            setCount(c => c + pts);
            setLevelCount(c => c + pts);
            return [];
        });
    }

    // ─── Shield helper ───────────────────────────────────────────────────────
    function handleShield() {
        if (shieldCountRef.current <= 0 || !isPlaying || shieldActiveRef.current) return;

        shieldCountRef.current -= 1;
        setShieldCount(shieldCountRef.current);
        saveShieldCount(shieldCountRef.current);
        userService.useHelper('shield').then(r => applyServerHelperCount('shield', r.count)).catch(() => {});
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
        userService.useHelper('slow').then(r => applyServerHelperCount('slow', r.count)).catch(() => {});
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

    // Picks the admin boss for a level from the prefetched catalog: the boss
    // assigned to exactly this level → the default boss → null. Mirrors the
    // backend's getBossForLevel so each level shows its own boss.
    function pickBossForLevel(lvl: number): Boss | null {
        const list = bossListRef.current;
        if (!list.length) return null;
        return list.find(b => b.isActive && b.level === lvl)
            || list.find(b => b.isActive && b.isDefault)
            || null;
    }

    async function startBossFight(lvl: number) {
        // Pick the admin-configured boss for this level (assigned → default →
        // null). HP (taps to defeat) and reward come straight from admin. Prefer
        // the prefetched catalog (instant); only hit the network if it's empty,
        // and only fall back to the local formula when both are unavailable.
        let admin: Boss | null = pickBossForLevel(lvl);
        if (!admin) {
            try {
                admin = await bossService.getBossForLevel(lvl);
            } catch {
                admin = null;
            }
        }

        const maxHP  = admin && admin.hp > 0 ? admin.hp : 10 + Math.floor(lvl / 10) * 10;
        const reward = admin ? admin.reward : Math.floor(lvl / 10) * 5;

        bossRef.current = admin;
        bossHPRef.current = maxHP;
        bossMaxHPRef.current = maxHP;
        bossRewardRef.current = reward;
        isBossFightRef.current = true;
        setBoss(admin);
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
        // The boss bonus is added to the score, so it's banked as coins on
        // /game/end like every other point. addCoins() just keeps the Home coin
        // balance optimistically in step until the next profile reconcile.
        countRef.current += reward;
        setCount(c => c + reward);
        addCoins(reward);

        setEmptyHeartCount(prev => Math.max(0, prev - 1));

        setTimeout(() => {
            // Boxes resume on an empty arena — restart them slowed down and let the
            // animation loop ramp the duration back to the level's value.
            durationEffRef.current = durationRef.current * DURATION_DIP_FACTOR;
            isBossFightRef.current = false;
            setShowBossDefeated(false);
        }, 2500);
    }

    // ─── Tap handler ─────────────────────────────────────────────────────────
    function handleTap(box: any) {
        if (box.isBoom) return;

        // ❤️ Life pickup: gives back one lost heart. No points, no combo — the
        // reward is the heart itself.
        if (box.isHeart) {
            tapsRef.current += 1;
            boomBox(box.id);
            setEmptyHeartCount(prev => Math.max(0, prev - 1));

            if (!cancelSoundRef.current && musicPopRef.current) {
                musicPopRef.current.setCurrentTime(0);
                musicPopRef.current.play();
            }
            if (!cancelVibrationRef.current) Vibration.vibrate(60);
            return;
        }

        // 💣 Tapped a hazard bomb: it blows up in place and costs a heart (a
        // shield eats the hit, same as a missed card). No points, combo and
        // streak reset — the punishment for not looking before tapping. Letting
        // the bomb fall off-screen is free; only touching it hurts.
        if (box.isBomb) {
            tapsRef.current += 1;
            boomBox(box.id);

            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            comboCountRef.current = 0;
            streakRef.current = 0;
            setCombo(0);

            if (shieldActiveRef.current) {
                shieldActiveRef.current = false;
                setShieldActive(false);
            } else {
                setEmptyHeartCount(prev => prev + 1);
            }

            if (!cancelSoundRef.current && musicBombRef.current) {
                musicBombRef.current.setSpeed(1);
                musicBombRef.current.setCurrentTime(0);
                musicBombRef.current.play();
            }
            if (!cancelVibrationRef.current) Vibration.vibrate([0, 120, 60, 200]);

            hurtFlashAnim.setValue(1);
            Animated.timing(hurtFlashAnim, {toValue: 0, duration: 550, useNativeDriver: true}).start();
            triggerMissShake();
            return;
        }

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
        // Keep whatever bomb deficit is still recovering: shift the effective
        // duration by the same step instead of snapping it to the new target.
        durationEffRef.current = Math.min(
            durationRef.current,
            durationEffRef.current + DURATION_STEP,
        );
        levelRef.current += 1;
        // Fresh level → a fresh batch of ten hazard bombs.
        bombsLeftRef.current = BOMBS_PER_LEVEL;
        setLevel(levelRef.current);
        triggerLevelUp(levelRef.current);

        // Every 4th level: if the player is down a heart, drop a life pickup.
        // A short delay keeps it from landing on top of the level-up overlay.
        if (levelRef.current % HEART_DROP_EVERY_LEVELS === 0 && emptyHeartCountRef.current > 0) {
            setTimeout(() => {
                // Re-check on arrival — the hearts may already be full again
                // (a boss defeat also restores one), and a boss fight blocks it.
                if (emptyHeartCountRef.current <= 0 || isBossFightRef.current) return;
                setBoxesData(prev => [
                    ...prev,
                    spawnBox(
                        cardRef.current,
                        durationEffRef.current,
                        !!cardRef.current.fallFromBottom,
                        false,
                        true,
                    ),
                ]);
            }, 1200);
        }

        // Free helpers are withheld until HELPER_GRANT_MIN_LEVEL — the boss below
        // still spawns on its own 10-level cadence regardless.
        const helpersUnlocked = levelRef.current >= HELPER_GRANT_MIN_LEVEL;

        if (helpersUnlocked && levelRef.current % 10 === 0) {
            const newBombs = bombCountRef.current + 1;
            bombCountRef.current = newBombs;
            setBombCount(newBombs);
            saveBombCount(newBombs);
            userService.grantHelper('bomb').then(r => applyServerHelperCount('bomb', r.count)).catch(() => {});
        }

        if (levelRef.current % 10 === 0) {
            // Clear the field the instant the boss level is reached: flag the
            // boss fight (stops the spawn/animation loops from adding or moving
            // boxes) and wipe every PlayBox now, so the boss intro plays on an
            // empty arena. startBossFight() then reveals the boss after 2s.
            isBossFightRef.current = true;
            setBoxesData([]);
            setTimeout(() => startBossFight(levelRef.current), 2000);
        }

        if (helpersUnlocked && levelRef.current % 15 === 0) {
            const newSlow = slowCountRef.current + 1;
            slowCountRef.current = newSlow;
            setSlowCount(newSlow);
            saveSlowCount(newSlow);
            userService.grantHelper('slow').then(r => applyServerHelperCount('slow', r.count)).catch(() => {});
        }

        if (helpersUnlocked && levelRef.current % 20 === 0) {
            const newShield = shieldCountRef.current + 1;
            shieldCountRef.current = newShield;
            setShieldCount(newShield);
            saveShieldCount(newShield);
            userService.grantHelper('shield').then(r => applyServerHelperCount('shield', r.count)).catch(() => {});
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
            // a local (Realm) fallback (loadBombCount/loadHelperCounts) on error.
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

            // Prefetch the admin boss catalog so every boss fight (levels 10, 20,
            // 30 … 100) picks its own boss by level straight from cache — no
            // per-fight network call to fail and drop to the fallback tier.
            bossService.getBosses()
                .then(list => { bossListRef.current = list; })
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
        lastFrameTsRef.current = 0;

        const animate = (ts: number) => {
            // Walk the effective duration back up to the level's duration after a
            // dip (bomb / boss), covering the whole gap in DURATION_DIP_RECOVER_MS.
            // dt is clamped so one stalled frame can't skip the recovery.
            const prevTs = lastFrameTsRef.current;
            lastFrameTsRef.current = ts;
            const dt = prevTs ? Math.min(ts - prevTs, 100) : 16;
            if (durationEffRef.current < durationRef.current) {
                const step =
                    (durationRef.current * (1 - DURATION_DIP_FACTOR) * dt) /
                    DURATION_DIP_RECOVER_MS;
                durationEffRef.current = Math.min(
                    durationRef.current,
                    durationEffRef.current + step,
                );
            }

            if (isBossFightRef.current) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            missHappenedRef.current = false;

            // Per-card travel direction (admin-managed). fromBottom → the box
            // floats UP and is "missed" when its top edge leaves the screen top;
            // otherwise it falls DOWN and is missed when its bottom passes the
            // screen bottom. The leading edge crosses the far boundary in both.
            const fromBottom = !!cardRef.current.fallFromBottom;

            setBoxesData(prev =>
                prev.filter((b: any) => {
                    if (b.isBoom) return true;

                    const speed = 0.05 * slowSpeedRef.current;
                    const newY = b.y + (b.ty - b.y) * speed;
                    const missed = fromBottom ? newY < 0 : newY + b.size > height;
                    if (!missed) return true;

                    // A bomb that leaves the screen untouched is the correct
                    // play — drop it silently, no heart, no shake. A missed bonus
                    // (money bag) or life pickup is just a missed chance, not a
                    // mistake: it disappears without costing a heart either.
                    if (b.isBomb || b.isHeart || b.isGolden) return false;

                    if (shieldActiveRef.current) {
                        shieldActiveRef.current = false;
                        setShieldActive(false);
                    } else {
                        if (!cancelVibrationRef.current) Vibration.vibrate(500);
                        setEmptyHeartCount(prev => prev + 1);
                    }
                    missHappenedRef.current = true;
                    // Drop the box instead of teleporting it back to the far edge:
                    // the spawner feeds the next one on its own cadence, so boxes
                    // keep arriving one at a time rather than in a re-synced batch.
                    return false;
                }).map((b: any) => {
                    if (b.isBoom) return b;

                    const speed = 0.05 * slowSpeedRef.current;
                    // Bombs (and the life pickup) reach further per frame than the
                    // cards → they fall noticeably, but not wildly, faster.
                    const boost = b.isBomb ? BOMB_FALL_BOOST : b.isHeart ? HEART_FALL_BOOST : 1;
                    const reach = (durationEffRef.current + 10) * boost;

                    return {
                        ...b,
                        x: b.x + (b.tx - b.x) * speed,
                        y: b.y + (b.ty - b.y) * speed,
                        tx: Math.abs(b.tx - b.x) < 1 ? Math.random() * (width - b.size) : b.tx,
                        ty: fromBottom ? b.y - reach : b.y + reach,
                        // Bombs never spin — they drop upright and straight.
                        rotation: (b.isRotation && !b.isBomb) ? (b.rotation + 2) % 360 : b.rotation,
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

    // Spawn new boxes — exactly one per tick, so they trickle down one after
    // another like snow instead of arriving as a batch. A self-rescheduling
    // timeout (not setInterval) lets each gap read the live level and slow-mo
    // factor: higher levels drip faster, slow-mo stretches the gap to match the
    // slower fall.
    useEffect(() => {
        if (!isPlaying) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const nextDelay = () => {
            const base = Math.max(
                SPAWN_INTERVAL_MIN_MS,
                SPAWN_INTERVAL_MS - (levelRef.current - 1) * SPAWN_INTERVAL_STEP_MS,
            );
            return base / slowSpeedRef.current;
        };

        const spawnOne = () => {
            if (!isBossFightRef.current) {
                // No cap on how many are in the air: the stream is bounded only by
                // how long a box takes to cross the screen versus the spawn gap.
                setBoxesData(prev => [
                    ...prev,
                    spawnBox(cardRef.current, durationEffRef.current, !!cardRef.current.fallFromBottom),
                ]);
            }
            timeoutId = setTimeout(spawnOne, nextDelay());
        };

        // First box drops right away — the field starts empty.
        timeoutId = setTimeout(spawnOne, 0);

        return () => clearTimeout(timeoutId);
    }, [isPlaying]);

    // Bomb spawner — its own timer, so bombs land between the cards on their own
    // irregular rhythm instead of replacing a card on the spawn beat. Each level
    // has a budget of BOMBS_PER_LEVEL (reset in levelUp / handleRetry); the gap
    // before each one is re-randomised, so no two bombs arrive on the same beat.
    useEffect(() => {
        if (!isPlaying) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const nextGap = () =>
            (BOMB_GAP_MIN_MS + Math.random() * (BOMB_GAP_MAX_MS - BOMB_GAP_MIN_MS)) /
            slowSpeedRef.current;

        const spawnBomb = () => {
            const eligible = !isBossFightRef.current && bombsLeftRef.current > 0;

            if (eligible) {
                bombsLeftRef.current -= 1;
                setBoxesData(prev => [
                    ...prev,
                    spawnBox(cardRef.current, durationEffRef.current, !!cardRef.current.fallFromBottom, true),
                ]);
            }
            // Keep ticking even when not eligible (boss fight, budget spent):
            // the next level refills the budget and the timer picks it up.
            timeoutId = setTimeout(spawnBomb, nextGap());
        };

        timeoutId = setTimeout(spawnBomb, nextGap());

        return () => clearTimeout(timeoutId);
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
                    <TouchableOpacity
                        onPress={menuHandler}
                        style={styles.menuBtn}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('openGameMenu')}
                    >
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
                        {(boss?.name || getBossTier(level).name).toUpperCase()} • TAP TO DESTROY
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
                    boss={boss}
                />
            )}

            {/* Boss defeated overlay */}
            {showBossDefeated && (
                <View style={styles.bossDefeatedOverlay}>
                    <Text allowFontScaling={false} style={styles.bossDefeatedEmoji}>🏆</Text>
                    <Text allowFontScaling={false} style={styles.bossDefeatedText}>
                        {(boss?.name || getBossTier(level).name).toUpperCase()} DEFEATED!
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
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={shieldActive ? t('shieldActive') : shieldCount > 0 ? `${t('useShield')}, ${shieldCount} ${t('available')}` : t('buyShield')}
                        accessibilityState={{disabled: shieldActive}}
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
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={bombCount > 0 ? `${t('useBomb')}, ${bombCount} ${t('available')}` : t('buyBomb')}
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
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={slowActive ? t('slowMotionActive') : slowCount > 0 ? `${t('useSlowMotion')}, ${slowCount} ${t('available')}` : t('buySlowMotion')}
                        accessibilityState={{disabled: slowActive}}
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
            <Animated.View pointerEvents="none"
                           style={[styles.flashOverlay, {opacity: hurtFlashAnim, backgroundColor: '#FF1744'}]}/>

            <LoseModal
                visible={isLoseModal}
                score={count}
                onRetry={handleRetry}
                onBack={handleExitConfirm}
                onWatchAd={handleWatchAd}
                canWatchAd={watchAdUsed < 2}
                adsEnabled={adsEnabled}
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
                adsEnabled={adsEnabled}
                onClose={() => {
                    setBuyModal(null);
                    setIsPlaying(true);
                }}
            />

            {boxesData
                .slice()
                .reverse()
                .map(box => (
                    <PlayBox key={box.id} box={box} handlePress={onBoxPress}/>
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
