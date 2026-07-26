import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useStableCallback} from '../../hooks/useStableCallback.ts';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/core';
import {useTranslation} from 'react-i18next';
import {loadMusic, pauceMusic, playMusic, releaseMusic, stopMusic} from '../../utils/helpers.ts';
import {playSfx, playSfxVaried, refreshSfxMuted} from '../../utils/sfx.ts';
import {haptic, refreshHapticsEnabled} from '../../utils/haptics.ts';
import {showRewardedAd} from '../../utils/ads.ts';
import {scale} from '../../utils/responsive.ts';
import {
    AccessibilityInfo,
    Animated,
    Dimensions,
    ImageBackground,
    PanResponder,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {colors} from '../../data/play.ts';
import {STORAGE_KEYS} from '../../utils/storageKeys.ts';
import {useShopStore} from '../../store/shopStore.ts';
import {useAuthStore} from '../../store/authStore.ts';
import {useDailyChallengesStore} from '../../store/dailyChallengesStore.ts';
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
import MenuIcon from '../../assets/icons/MenuIcon.tsx';
import BombCard from '../../assets/icons/BombCard.tsx';
import ShieldIcon from '../../assets/icons/ShieldIcon.tsx';
import SlowIcon from '../../assets/icons/SlowIcon.tsx';
import FlameIcon from '../../assets/icons/FlameIcon.tsx';
import BoltIcon from '../../assets/icons/BoltIcon.tsx';
import StarBurstIcon from '../../assets/icons/StarBurstIcon.tsx';
import {BARREL_ART_SCALE} from '../../assets/icons/MineBarrel.tsx';
import Coin from '../../assets/icons/Coin.tsx';
import {BombBlast} from '../../assets/icons/FallingBomb.tsx';

// components
import AnimatedBackground from '../../components/ui/Play/AnimatedBackground.tsx';
import BossBox, {getBossTier} from '../../components/ui/Play/BossBox.tsx';
import CoinCount from '../../components/ui/CoinCount/CoinCount.tsx';
import PlayBox, {buildBoxStyle} from '../../components/ui/Play/PlayBox.tsx';
import Hearts from '../../components/ui/Play/Hearts.tsx';
import LoseModal from '../../components/ui/Play/LoseModal.tsx';
import ExitModal from '../../components/ui/Play/ExitModal.tsx';
import BuyHelperModal, {HelperType, HELPER_CONFIGS} from '../../components/ui/Play/BuyHelperModal.tsx';
import Level from '../../components/ui/Play/Level.tsx';
import Progress from '../../components/ui/Play/Progress.tsx';
import GameMenuModal from '../../components/ui/Play/GameMenuModal.tsx';
import CountdownOverlay from '../../components/ui/Play/CountdownOverlay.tsx';

// store
import {useGlobalStore} from '../../store/globalStore.ts';
import {useConfigStore} from '../../store/configStore.ts';

// styles
import styles from './Play.style.ts';
import {GRADIENT_LIGHT, LILAC, ORANGE, ORANGE_RED} from '../../constants/colors.ts';
import ScreenStatusBar from '../../components/ui/ScreenStatusBar/ScreenStatusBar.tsx';
import {TOP_OFFSET} from "../../constants/uiConstants.ts";

const {width, height} = Dimensions.get('window');

const HEARTS_LENGTH = 7;
// Gap between two consecutive drops. Tightens as the level climbs, and is
// stretched by the slow-mo helper so the stream thins out with the fall speed.
const SPAWN_INTERVAL_MS = 900;
const SPAWN_INTERVAL_MIN_MS = 380;
const SPAWN_INTERVAL_STEP_MS = 45;
// How many boxes may be in the air at once. The stream used to be bounded only
// by "fall time ÷ spawn gap", which is fine on the intended cadence but has no
// floor: a slow device (or a level where the gap has tightened to its minimum
// while the fall is still long) accumulates boxes, and past a point every extra
// box costs the frame that all the others need. The card spawner skips its beat
// at MAX_CARD_BOXES; the specials (hazards, pickups, gift, bag) get the higher
// ceiling and hold their per-level budget for the next gap instead of spending it
// on a box that can't fit. Both sit well above the ~8 a normal level reaches, so
// they only ever bite when something has already gone wrong.
const MAX_CARD_BOXES = 14;
const MAX_LIVE_BOXES = 20;
// How long a popped box's aftermath (a card's hole marker, a trap's blast) stays
// on screen after the tap.
const TRACK_LINGER_MS = 1500;
const INITIAL_DURATION = 30;
const DURATION_STEP = 10;
const INITIAL_BOMBS = 0;
const COMBO_WINDOW_MS = 550;
const COMBO_RESET_MS = 850;
// 💰 Money bag: the bonus drop, worth a random 1–5 points. It used to be a roll on
// every plain card, so a lucky stretch could rain bags while another level saw
// almost none. Now it works like the hazards: its OWN timer plus a per-level
// budget of MONEY_BAGS_PER_LEVEL, each after a re-randomised gap, so exactly
// three arrive per level and never on a predictable beat. Free to miss.
const MONEY_BAGS_PER_LEVEL = 3;
// What a tapped bag pays out — a fresh roll in [MONEY_BAG_MIN, MONEY_BAG_MAX]
// every time, so a bag is a small gamble of its own. Revealed with the same 🪙
// coin pop the gift uses, so the player sees exactly what this bag was worth.
const MONEY_BAG_MIN = 1;
const MONEY_BAG_MAX = 5;
const rollMoneyBag = () =>
    MONEY_BAG_MIN + Math.floor(Math.random() * (MONEY_BAG_MAX - MONEY_BAG_MIN + 1));
const BAG_GAP_MIN_MS = 3500;
const BAG_GAP_MAX_MS = 7000;
// Hazard bombs fall in with the cards: tapping one costs a heart, letting it
// fall past the edge is free. Every level — the first one included — drops
// exactly BOMBS_PER_LEVEL of them, each after a random gap (never on a
// predictable beat), from their own timer independent of the card spawner.
// They fall a bit quicker than the cards (BOMB_FALL_BOOST× the per-frame reach),
// so they cross the screen faster and give the player less time to hesitate.
const BOMBS_PER_LEVEL = 5;
const BOMB_FALL_BOOST = 1.3;
// Life pickup: every HEART_DROP_EVERY_LEVELS levels the game checks whether the
// player has lost a heart; if so, one heart drops in (a bit quicker than the
// cards). Tapping it gives the lost life back. Nothing drops on a full heart row.
const HEART_DROP_EVERY_LEVELS = 3;
const HEART_FALL_BOOST = 1;
const BOMB_GAP_MIN_MS = 1200;
const BOMB_GAP_MAX_MS = 5000;
// Mine barrel: the second hazard, held back until BARREL_MIN_LEVEL so the early
// levels teach the bomb on its own before a second trap joins it. Heavier than
// the bomb — it drops slower and there are fewer of them per level — but the hit
// is worse: a heart *and* a longer shake, and it wobbles as it comes down so it
// never reads as just a differently-painted bomb.
const BARREL_MIN_LEVEL = 3;
const BARRELS_PER_LEVEL = 2;
const BARREL_FALL_BOOST = 0.85;
const BARREL_GAP_MIN_MS = 3000;
const BARREL_GAP_MAX_MS = 7000;
const BARREL_WOBBLE_DEG = 11;
const BARREL_WOBBLE_SPEED = 0.055;
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

// ─── Freeze pickup ───────────────────────────────────────────────────────────
// An uncommon variant a plain card can roll into (mutually exclusive with the
// money bag). Tapping it drops the whole field to FREEZE_SPEED for a short
// burst — a free pocket slow-mo. No points, no combo; the reward is the pause
// it buys. Like the money bag it's free to miss (letting it fall costs nothing).
const FREEZE_SPAWN_CHANCE = 0.02;
const FREEZE_SPEED = 0.4;            // field-speed factor while a freeze is active
const FREEZE_DURATION_MS = 5000;
// Held back until after level 4 — the early levels stay a plain tap game before
// the freeze pickup is introduced.
const FREEZE_MIN_LEVEL = 5;

// ─── Gift / mystery prize box ─────────────────────────────────────────────────
// A rare gamble drop, tied to the level-up rather than to a timer: every
// GIFT_DROP_EVERY_LEVELS levels exactly ONE gift comes down (the life pickup
// works the same way). Tapping it is a coin flip: GIFT_BOOM_CHANCE of the time it
// 💥 booms and costs a heart like a hazard bomb, otherwise it pays out
// GIFT_REWARD points (revealed as a 🪙 coin). Free to miss — letting it fall past
// the edge costs nothing. Held back until GIFT_MIN_LEVEL so the very first level
// stays a plain tap game before the gamble is introduced.
const GIFT_BOOM_CHANCE = 0.25;   // odds a tapped gift booms instead of paying out
const GIFT_REWARD = 5;
const GIFT_MIN_LEVEL = 2;
const GIFT_DROP_EVERY_LEVELS = 2;
// Gifts per drop — one, so the level-up brings a single box, not a burst.
const GIFTS_PER_DROP = 1;

// ─── Falling-object sizes ────────────────────────────────────────────────────
// Every falling object is sized as a share of the screen (responsive.scale maps
// the reference-device pixel value onto the current screen width) instead of a
// raw pixel count, so a balloon/bomb/heart that looks right on a 375-wide phone
// stays in proportion on a tablet rather than shrinking to a dot.
//
// The hazards and the life pickup use their OWN fixed size here rather than
// inheriting the equipped card's size — before this, equipping a larger card
// skin (e.g. the 130px balloon) blew the bombs and hearts up along with it, so
// a bomb was a different size depending on which skin you had on. Balloons (the
// tappable cards) keep their per-skin size, scaled to the screen the same way;
// admin SVG cards keep their own authored width/height, shrunk alongside the
// rest on a big screen (below) and applied in PlayBox.
//
// 📱 Big-screen shrink: `scale` is linear in width, which is right for phones but
// wrong for tablets — on an 820 dp iPad it turns a 100 dp card into 219 dp, so a
// few oversized boxes fill the whole field and the game reads as zoomed-in. A
// finger doesn't grow with the screen, so past BIG_SCREEN_W every drop falls at
// BIG_SCREEN_FACTOR of its scaled size. Phones are untouched: at BIG_SCREEN_W and
// under the factor is 1, so they get exactly what `scale` always gave them.
const BIG_SCREEN_W = 500;
const BIG_SCREEN_FACTOR = width > BIG_SCREEN_W ? 0.8 : 1;
const boxScale = (size: number) => Math.round(scale(size) * BIG_SCREEN_FACTOR);

const BOMB_SIZE = boxScale(100);
const HEART_SIZE = boxScale(100);
const BARREL_SIZE = boxScale(110);
// The gift is drawn a touch larger than the other drops — it's a rare event
// (one every couple of levels), so it should read as the one worth reacting to.
const GIFT_SIZE = boxScale(120);
const BAG_SIZE = boxScale(110);
// ❄️ Freeze pickup — its own size like the other specials. It spawns as a roll on
// a plain card, so before this it inherited the equipped skin's size and a big
// skin made the snowflake bigger than the bomb next to it.
const FREEZE_SIZE = boxScale(90);
// 🃏 The tappable card. A skin carries its own size (a 130 balloon stays bigger
// than a 100 card); CARD_SIZE is what a skin without one falls back to.
const CARD_BASE = 100;
const CARD_SIZE = boxScale(CARD_BASE);
// How far a finger must travel from where it landed before the swipe layer stops
// treating the gesture as a tap (see the swipe-to-tap section). Tied to the drop
// size so it means the same thing on every screen: a quarter of a box clears a
// resting finger's jitter comfortably while staying well inside a real swipe's
// per-frame travel, so swipe-to-pop still pops everything the finger crosses.
const SWIPE_MIN_DIST = Math.round(BOMB_SIZE * 0.25);

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
    isBarrel = false,
    isGift = false,
    allowFreeze = false,
    isBag = false,
) {
    // A plain card (never a hazard, the life pickup, a gift or a money bag) can
    // roll into a ❄️ freeze pickup. The gift and the money bag are not rolls:
    // each has its own timer and comes in as a flag.
    const isPlainCard = !isBomb && !isHeart && !isBarrel && !isGift && !isBag;
    const isFreeze = isPlainCard && allowFreeze && Math.random() < FREEZE_SPAWN_CHANCE;
    const isGolden = isBag;
    // Fixed, screen-relative size per object type. Every special (hazards, the
    // life pickup, the freeze pickup, the gift, the bag) takes its own size,
    // independent of the equipped card; a regular card keeps its skin's size,
    // scaled to the screen the same way. This overrides card.size (spread in
    // below) so every spawned box carries the right size.
    const size = isBomb ? BOMB_SIZE
        : isBarrel ? BARREL_SIZE
            : isHeart ? HEART_SIZE
                : isGift ? GIFT_SIZE
                    : isBag ? BAG_SIZE
                        : isFreeze ? FREEZE_SIZE
                            : card.size ? boxScale(card.size) : CARD_SIZE;
    // Spawn just off the edge the box travels from (below for fromBottom, above
    // otherwise) so it slides into view right away. The spacing between boxes
    // comes from the spawn cadence, not from a random head start off-screen —
    // that is what makes them arrive one after another like falling snow.
    const offset = size + Math.random() * 120;
    const y = fromBottom ? height + offset : -offset;
    // The barrel is drawn wider than its box size (see BARREL_ART_SCALE in
    // PlayBox), so its horizontal range has to account for the real artwork
    // width — otherwise a barrel spawned at the far right hangs off the edge.
    const spanSize = isBarrel ? size * BARREL_ART_SCALE : size;
    const maxX = Math.max(0, width - spanSize);
    return {
        ...card,
        size,
        // PlayBox draws an admin SVG at its authored width/height, ahead of size,
        // so those get the big-screen shrink too — otherwise they'd be the one
        // drop still coming down full-size on a tablet.
        ...(card.width ? {width: Math.round(card.width * BIG_SCREEN_FACTOR)} : null),
        ...(card.height ? {height: Math.round(card.height * BIG_SCREEN_FACTOR)} : null),
        id: uuId.v4(),
        x: Math.random() * maxX,
        y,
        tx: Math.random() * maxX,
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
        // The native view this box drives, filled in by PlayBox's ref, and the
        // flag that marks it spent (tapped or fallen past the edge). Declared
        // here so every box has the same shape from birth — the loop touches
        // both on every frame.
        node: null as any,
        __dead: false,
        isBoom: false,
        isGolden,
        isFreeze,
        isGift,
        isBomb,
        isHeart,
        isBarrel,
    };
}

// Screen-space footprint of a falling box, mirroring how PlayBox lays each
// variant out. Every type is positioned with its top-left at (x, y) — the
// rotation transforms pivot around the centre and cancel out — but the barrel
// is drawn wider than its box size and an admin SVG uses its authored
// width/height. Used by the swipe layer below to work out what the finger is
// over; the "square" card type is the one approximation (PlayBox rolls its own
// random 101–150px size internally, so its hit area is the box size instead).
function boxBounds(b: any): {w: number; h: number} {
    if (b.isBarrel) {
        const s = Math.round((b.size || 100) * BARREL_ART_SCALE);
        return {w: s, h: s};
    }
    const isSpecial = b.isBomb || b.isHeart || b.isFreeze || b.isGift || b.isGolden;
    if (!isSpecial && typeof b.iconSvg === 'string' && b.iconSvg.trim()) {
        return {w: b.width || b.size || 100, h: b.height || b.size || 100};
    }
    const s = b.size || 100;
    return {w: s, h: s};
}

// Sound and haptics are native calls, and they run on the JS thread — the same
// thread the box loop below drives at 60fps. Fired inline from a tap handler they
// land *before* React commits that tap's render, so their cost is added straight
// onto the frame's budget and the whole field visibly hitches for a beat on every
// tap.
//
// Deferring by one macrotask lets React commit and paint first; the feedback
// then fires roughly a frame later, which is imperceptible for a sound or a
// buzz but takes them off the critical path entirely.
//
// Used for the presses that land in the loop's hot path — every card tap, every
// boss hit. The three helper buttons fire a handful of times a round and already
// rewrite the whole board when they do, so they stay inline; menu and settings
// presses aren't competing with the loop at all.
function deferFeedback(fire: () => void): void {
    setTimeout(fire, 0);
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
    // durationRef = the level's duration (target). durationEffRef = what the boxes
    // actually travel with right now; a bomb or a boss defeat pulls it down and the
    // animation loop walks it back up to durationRef.
    const durationRef = useRef(INITIAL_DURATION);
    const durationEffRef = useRef(INITIAL_DURATION);
    const lastFrameTsRef = useRef(0);
    const countRef = useRef(0);
    const bombCountRef = useRef(INITIAL_BOMBS);
    // Hazard bombs still owed for the current level; refilled to BOMBS_PER_LEVEL
    // on every level-up so each level drops exactly ten of them.
    const bombsLeftRef = useRef(BOMBS_PER_LEVEL);
    // Same idea for the mine barrels, refilled on every level-up.
    const barrelsLeftRef = useRef(BARRELS_PER_LEVEL);
    // …and for the 💰 money bags: three per level, no more.
    const bagsLeftRef = useRef(MONEY_BAGS_PER_LEVEL);
    const levelRef = useRef(1);
    const watchAdUsedRef = useRef(0);
    const lastTapTimeRef = useRef(0);
    const comboCountRef = useRef(0);
    const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streakRef = useRef(0);
    const shieldActiveRef = useRef(false);
    const slowActiveRef = useRef(false);
    const slowSpeedRef = useRef(1);
    const shieldCountRef = useRef(0);
    const slowCountRef = useRef(0);
    const slowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slowTimerValueRef = useRef(0);
    // ❄️ Freeze: an extra field-speed factor that stacks with the slow-mo helper,
    // plus the timeout that lifts it back to 1.
    const freezeSpeedRef = useRef(1);
    const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    // 🎁 Gift-box reveal (the win/boom pop after tapping a mystery box).
    const giftRevealOpacityAnim = useRef(new Animated.Value(0)).current;
    const giftRevealScaleAnim = useRef(new Animated.Value(0.5)).current;

    // ─── State ────────────────────────────────────────────────────────────────
    const [count, setCount] = useState(0);
    const [levelCount, setLevelCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [emptyHeartCount, setEmptyHeartCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoseModal, setIsLoseModal] = useState(false);
    const [isExitModal, setIsExitModal] = useState(false);
    const [isMenuModal, setIsMenuModal] = useState(false);
    const [isCountdown, setIsCountdown] = useState(false);
    const [buyModal, setBuyModal] = useState<HelperType | null>(null);
    // ─── The field ────────────────────────────────────────────────────────────
    // `boxesData` is the *render list* — which boxes exist. It changes only when
    // one spawns or leaves, never while they fall: the animation loop mutates the
    // box objects in place and writes each new style straight onto its native
    // view (see PlayBox.buildBoxStyle). Driving positions through setState
    // instead meant a full re-render of this screen, a fresh object per box and a
    // React commit 60×/sec — the single biggest cost on the field, and the reason
    // a busy screen stuttered.
    //
    // `liveRef` always holds the same array as `boxesData`: it's what the loop,
    // the swipe hit-test and the spawners read, so none of them can act on a
    // frame-old snapshot. Starts empty — the spawn effect drips the first box in
    // immediately.
    const [boxesData, setBoxesData] = useState<any[]>([]);
    const liveRef = useRef<any[]>([]);
    // Popped boxes still showing their aftermath (a card's hole marker, a
    // trap's blast) for TRACK_LINGER_MS. They're out of the live list the instant
    // they're tapped — nothing moves them, nothing can hit-test them, and because
    // each is a frozen copy React re-renders it exactly once.
    const [tracks, setTracks] = useState<any[]>([]);
    const trackTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
    // A screen reader turns the per-box Pressables back on (see PlayBox).
    const [a11y, setA11y] = useState(false);
    const [bombCount, setBombCount] = useState(INITIAL_BOMBS);
    const [combo, setCombo] = useState(0);
    const [watchAdUsed, setWatchAdUsed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [shieldCount, setShieldCount] = useState(0);
    const [slowCount, setSlowCount] = useState(0);
    const [shieldActive, setShieldActive] = useState(false);
    const [slowActive, setSlowActive] = useState(false);
    const [slowTimer, setSlowTimer] = useState(0);
    const [freezeActive, setFreezeActive] = useState(false);
    const [isBossFight, setIsBossFight] = useState(false);
    const [bossHP, setBossHP] = useState(0);
    const [bossMaxHP, setBossMaxHP] = useState(0);
    const [boss, setBoss] = useState<Boss | null>(null);
    const [showBossDefeated, setShowBossDefeated] = useState(false);
    // 🎁 What the reveal overlay is showing: a win (with the coin amount that was
    // just earned — the gift's payout or a money bag's) or a boom. null = hidden.
    const [giftReveal, setGiftReveal] = useState<{kind: 'win' | 'boom'; amount: number} | null>(null);

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
        setLevelLength(20);

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

        // Advance the device-local daily challenges from this finished run: +1
        // game, the run's banked coins (score), and the best level reached. Read
        // from refs so it's correct even in the stale-closure cleanup path.
        useDailyChallengesStore.getState().recordGame({
            coins: score,
            level: levelRef.current,
        });

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
        // Both gates live in their own modules — utils/sfx.ts and utils/haptics.ts —
        // and are checked inside every playSfx()/haptic() call, so this screen no
        // longer keeps its own copies of the flags.
        await Promise.all([refreshSfxMuted(), refreshHapticsEnabled()]);
    }

    async function handleWatchAdHelper(type: HelperType) {
        if (watchAdUsedRef.current >= 2) return;
        // Grant the free helper only after the rewarded ad is watched to the end.
        const earned = await showRewardedAd();
        if (!earned) return;
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

    // Heavier cousin of triggerMissShake, used when a mine barrel goes off:
    // wider swings that take longer to settle, so the barrel feels like the
    // bigger mistake of the two traps.
    function triggerBarrelShake() {
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 18, duration: 55, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -16, duration: 55, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 12, duration: 55, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -9, duration: 55, useNativeDriver: true}),
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

    // 🎁 Pops the outcome (a gold "+N" coin on a win, a red "💥 BOOM" on a boom)
    // for a beat so the result reads clearly, then fades it out. The money bag
    // reuses it too, passing its own payout as the amount.
    function triggerGiftReveal(good: boolean, amount: number = GIFT_REWARD) {
        setGiftReveal({kind: good ? 'win' : 'boom', amount});
        giftRevealOpacityAnim.setValue(1);
        giftRevealScaleAnim.setValue(0.4);
        Animated.parallel([
            Animated.spring(giftRevealScaleAnim, {toValue: 1, useNativeDriver: true, friction: 4}),
            Animated.sequence([
                Animated.delay(700),
                Animated.timing(giftRevealOpacityAnim, {toValue: 0, duration: 350, useNativeDriver: true}),
            ]),
        ]).start(() => setGiftReveal(null));
    }

    // ─── Game actions ─────────────────────────────────────────────────────────

    function menuHandler() {
        if (isLoseModal || isExitModal || buyModal !== null) return;
        setIsPlaying(false);
        setIsMenuModal(true);
    }

    // Resuming from the pause menu doesn't drop the player straight back into a
    // live arena — the menu closes, the field stays frozen, and the 3·2·1·GO!
    // overlay counts them back in. `isPlaying` stays false for the whole count.
    function handleMenuClose() {
        setIsMenuModal(false);
        setIsCountdown(true);
    }

    function handleCountdownFinish() {
        setIsCountdown(false);
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

    // Backing out of the exit prompt resumes exactly the way closing the pause
    // menu does — through the 3·2·1, not straight into a live arena. The player
    // got here from the menu with the field frozen, so dropping them back in on
    // the same frame they tap "no" costs them boxes they never saw coming.
    // isPlaying is already false; the countdown's finish handler flips it back.
    function handleExitCancel() {
        setIsExitModal(false);
        setIsCountdown(true);
    }

    function gameOver() {
        setIsPlaying(false);
        setIsLoseModal(true);
        stopMusic();
        // ❄️ A live freeze dies with the run. Its tint and FROZEN badge would
        // otherwise sit on top of the lose modal until the wall-clock timer
        // happened to expire, and the speed factor would still be in place if the
        // player revived off the rewarded ad — a revive on a frozen field.
        if (freezeTimerRef.current) {
            clearTimeout(freezeTimerRef.current);
            freezeTimerRef.current = null;
        }
        freezeSpeedRef.current = 1;
        setFreezeActive(false);
    }

    async function handleWatchAd() {
        // Revive with a heart only after the rewarded ad is watched to the end.
        const earned = await showRewardedAd();
        if (!earned) return;
        setEmptyHeartCount(prev => Math.max(0, prev - 1));
        setIsLoseModal(false);
        setIsPlaying(true);
        clearField();

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
        barrelsLeftRef.current = BARRELS_PER_LEVEL;
        bagsLeftRef.current = MONEY_BAGS_PER_LEVEL;
        levelRef.current = 1;
        comboCountRef.current = 0;
        streakRef.current = 0;
        shieldActiveRef.current = false;
        slowActiveRef.current = false;
        slowSpeedRef.current = 1;
        // Clear any lingering ❄️ freeze.
        freezeSpeedRef.current = 1;
        if (freezeTimerRef.current) { clearTimeout(freezeTimerRef.current); freezeTimerRef.current = null; }
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
        setFreezeActive(false);
        setWatchAdUsed(0);
        setIsBossFight(false);
        setBossHP(0);
        setBossMaxHP(0);
        setBoss(null);
        setShowBossDefeated(false);
        setIsPlaying(true);
        setIsLoseModal(false);
        clearField();
        // startGameSession() reloads the helper stock from the server (with an
        // offline local (Realm) fallback).
        startGameSession();
    }

    // Every heart loss funnels through here so the shield gets first refusal in
    // exactly one place. Returns true when a heart was actually taken — the
    // Hearts row animates the break itself off the new emptyCount.
    function loseHeart(): boolean {
        if (shieldActiveRef.current) {
            shieldActiveRef.current = false;
            setShieldActive(false);
            return false;
        }
        setEmptyHeartCount(prev => prev + 1);
        return true;
    }

    // ─── Field mutations ──────────────────────────────────────────────────────
    // Every add/remove goes through these three so `liveRef` and `boxesData`
    // never drift apart: the array is replaced (React sees a new list), the box
    // objects inside it are not (they're the entities the loop mutates, and a
    // re-render of an unchanged box is a memo bail-out).

    // Adds one box, unless the field is already at `limit`.
    function addBox(box: any, limit: number = MAX_LIVE_BOXES): boolean {
        if (liveRef.current.length >= limit) return false;
        const next = [...liveRef.current, box];
        liveRef.current = next;
        setBoxesData(next);
        return true;
    }

    // Wipes the arena: falling boxes and any aftermath still on screen.
    function clearField() {
        liveRef.current = [];
        setBoxesData([]);
        setTracks([]);
    }

    // Takes a box out of play. Cards and the two traps leave their aftermath
    // behind for a beat (a hole marker / a blast); the pickups and the money bag
    // simply vanish, which is what they always did — PlayBox drew nothing for a
    // popped one.
    function popBox(box: any) {
        if (box.__dead) return;
        box.__dead = true;
        const next = liveRef.current.filter(b => b !== box);
        liveRef.current = next;
        setBoxesData(next);

        if (box.isHeart || box.isFreeze || box.isGift || box.isGolden) return;

        // A frozen copy: it keeps the position the box was popped at and is never
        // touched again, so it renders once and stays put.
        const track = {...box, isBoom: true, node: null};
        setTracks(prev => [...prev, track]);
        const timer = setTimeout(() => {
            trackTimersRef.current.delete(timer);
            setTracks(prev => prev.filter(t => t !== track));
        }, TRACK_LINGER_MS);
        trackTimersRef.current.add(timer);
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

        // The helper clears the whole board, so it gets the blast a touch lower
        // and longer than a single hazard bomb going off.
        playSfx('bomb', {rate: 0.85});

        haptic('bombHelper');

        bombFlashAnim.setValue(1);
        Animated.timing(bombFlashAnim, {toValue: 0, duration: 700, useNativeDriver: true}).start();

        // Hazard bombs and the life pickup are wiped by the blast too, but
        // they score nothing — only the real cards on screen pay out.
        const pts = liveRef.current.filter(
            b => !b.isBomb && !b.isBarrel && !b.isHeart && !b.isGift,
        ).length;
        clearField();
        countRef.current += pts;
        setCount(c => c + pts);
        setLevelCount(c => c + pts);
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

        playSfx('shield');

        shieldFlashAnim.setValue(1);
        Animated.timing(shieldFlashAnim, {toValue: 0, duration: 600, useNativeDriver: true}).start();

        haptic('shield');
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

        playSfx('slow');

        slowFlashAnim.setValue(1);
        Animated.timing(slowFlashAnim, {toValue: 0, duration: 800, useNativeDriver: true}).start();

        haptic('slow');

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

    // Combined field-speed factor read by the physics/spawn loops. The slow-mo
    // helper and the free ❄️ freeze pickup stack multiplicatively, so a freeze
    // during an active slow-mo just slows things further instead of one value
    // clobbering the other.
    function effSlow(): number {
        return slowSpeedRef.current * freezeSpeedRef.current;
    }

    // ─── Freeze pickup ────────────────────────────────────────────────────────
    // Tapping a ❄️ drops the field speed to FREEZE_SPEED for a short burst — a
    // free pocket slow-mo. Reuses the slow-mo helper's cyan flash for the cue.
    function triggerFreeze() {
        freezeSpeedRef.current = FREEZE_SPEED;
        setFreezeActive(true);
        slowFlashAnim.setValue(1);
        Animated.timing(slowFlashAnim, {toValue: 0, duration: 800, useNativeDriver: true}).start();
        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = setTimeout(() => {
            freezeSpeedRef.current = 1;
            setFreezeActive(false);
            freezeTimerRef.current = null;
        }, FREEZE_DURATION_MS);
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
        clearField();
    }

    function handleBossTap() {
        if (!isPlaying || !isBossFightRef.current) return;
        const newHP = bossHPRef.current - 1;
        bossHPRef.current = newHP;
        setBossHP(newHP);

        countRef.current += 1;
        setCount(c => c + 1);
        tapsRef.current += 1;

        // A blunt thud rather than the card blip — chipping the boss down should
        // feel like landing punches on something solid.
        deferFeedback(() => { playSfxVaried('hit', 0.1); haptic('hit'); });

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
        // `__dead` is set the moment a box is popped or falls off, so a second
        // sample of the same box within one drag (or a Pressable firing after the
        // swipe layer already got it) can't score it twice.
        if (box.isBoom || box.__dead) return;

        // ❤️ Life pickup: gives back one lost heart. No points, no combo — the
        // reward is the heart itself.
        if (box.isHeart) {
            tapsRef.current += 1;
            popBox(box);
            setEmptyHeartCount(prev => Math.max(0, prev - 1));

            deferFeedback(() => { playSfx('heart'); haptic('heart'); });
            return;
        }

        // 💣 Tapped a hazard bomb: it blows up in place and costs a heart (a
        // shield eats the hit, same as a missed card). No points, combo and
        // streak reset — the punishment for not looking before tapping. Letting
        // the bomb fall off-screen is free; only touching it hurts.
        if (box.isBomb || box.isBarrel) {
            const isBarrel = !!box.isBarrel;
            tapsRef.current += 1;
            popBox(box);

            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            comboCountRef.current = 0;
            streakRef.current = 0;
            setCombo(0);

            loseHeart();

            // The barrel is the heavier of the two traps, so its blast sits
            // lower and its punishment lands harder: a longer flash, a deeper
            // rumble and the big shake instead of the bomb's quick jolt.
            deferFeedback(() => {
                playSfx('bomb', isBarrel ? {rate: 0.7} : undefined);
                haptic(isBarrel ? 'barrel' : 'bombHazard');
            });

            hurtFlashAnim.setValue(1);
            Animated.timing(hurtFlashAnim, {
                toValue: 0,
                duration: isBarrel ? 800 : 550,
                useNativeDriver: true,
            }).start();
            if (isBarrel) triggerBarrelShake();
            else triggerMissShake();
            return;
        }

        // ❄️ Freeze: a free pocket slow-mo. A utility pickup — no points and no
        // combo of its own; the reward is the slowdown it turns on.
        if (box.isFreeze) {
            tapsRef.current += 1;
            popBox(box);
            triggerFreeze();
            deferFeedback(() => { playSfx('slow'); haptic('slow'); });
            return;
        }

        // 🎁 Mystery gift box: a gamble. GIFT_BOOM_CHANCE of the time it booms and
        // costs a heart like a hazard bomb (combo/streak reset, hurt flash, shake);
        // otherwise it pays out GIFT_REWARD points. Either way the outcome is shown
        // by the reveal overlay. Free to miss — the fall-off path costs nothing.
        if (box.isGift) {
            tapsRef.current += 1;
            popBox(box);

            if (Math.random() < GIFT_BOOM_CHANCE) {
                if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
                comboCountRef.current = 0;
                streakRef.current = 0;
                setCombo(0);
                loseHeart();
                triggerGiftReveal(false);
                deferFeedback(() => { playSfx('bomb'); haptic('bombHazard'); });
                hurtFlashAnim.setValue(1);
                Animated.timing(hurtFlashAnim, {toValue: 0, duration: 550, useNativeDriver: true}).start();
                triggerMissShake();
            } else {
                countRef.current += GIFT_REWARD;
                setCount(c => c + GIFT_REWARD);
                setLevelCount(c => c + GIFT_REWARD);
                triggerGiftReveal(true, GIFT_REWARD);
                deferFeedback(() => { playSfx('coin'); haptic('coin'); });
            }
            return;
        }

        // 💰 The money bag is a bonus payout, so it earns the coin jingle; plain
        // cards get the blip.
        //
        // The hottest path in the game — this runs on every single card tap, so
        // it's the one that most needs to stay off the frame's critical path.
        // The detune is small on purpose: the old ±0.35 range swung the pitch so
        // wide that consecutive taps sounded like two different sounds.
        deferFeedback(() => {
            if (box.isGolden) playSfx('coin');
            else playSfxVaried('tap', 0.14);
            haptic(box.isGolden ? 'coin' : 'tap');
        });

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

        // Points: golden = a fresh 1–5 roll, normal = 1, both × streak multiplier
        const pts = box.isGolden ? rollMoneyBag() : 1;

        // 💰 A bag is a payout like the gift, so it gets the same coin reveal —
        // the player sees the exact number of coins the bag was worth.
        if (box.isGolden) triggerGiftReveal(true, pts);

        popBox(box);
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
        // Fresh level → a fresh batch of hazards, bombs and barrels alike, plus
        // the level's three money bags.
        bombsLeftRef.current = BOMBS_PER_LEVEL;
        barrelsLeftRef.current = BARRELS_PER_LEVEL;
        bagsLeftRef.current = MONEY_BAGS_PER_LEVEL;
        setLevel(levelRef.current);
        triggerLevelUp(levelRef.current);

        // Register the level the instant it's reached, so the "reach level 10"
        // daily challenge completes live rather than waiting for game end.
        useDailyChallengesStore.getState().recordLevel(levelRef.current);

        // Every 4th level: if the player is down a heart, drop a life pickup.
        // A short delay keeps it from landing on top of the level-up overlay.
        if (levelRef.current % HEART_DROP_EVERY_LEVELS === 0 && emptyHeartCountRef.current > 0) {
            setTimeout(() => {
                // Re-check on arrival — the hearts may already be full again
                // (a boss defeat also restores one), and a boss fight blocks it.
                if (emptyHeartCountRef.current <= 0 || isBossFightRef.current) return;
                addBox(spawnBox(
                    cardRef.current,
                    durationEffRef.current,
                    !!cardRef.current.fallFromBottom,
                    false,
                    true,
                ));
            }, 1200);
        }

        // 🎁 Every GIFT_DROP_EVERY_LEVELS levels: exactly GIFTS_PER_DROP mystery
        // gift comes down — no timer, so the gamble stays a rare event tied to the
        // level-up instead of a steady stream. Same short delay as the life pickup
        // so it doesn't land under the level-up overlay.
        if (
            levelRef.current >= GIFT_MIN_LEVEL &&
            levelRef.current % GIFT_DROP_EVERY_LEVELS === 0
        ) {
            setTimeout(() => {
                // A boss fight owns the arena — skip the drop rather than throw a
                // gift into it (boss levels are every 10th, so a multiple of 2 too).
                if (isBossFightRef.current) return;
                for (let i = 0; i < GIFTS_PER_DROP; i++) {
                    addBox(spawnBox(
                        cardRef.current,
                        durationEffRef.current,
                        !!cardRef.current.fallFromBottom,
                        false,
                        false,
                        false,
                        true, // isGift
                    ));
                }
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
            clearField();
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

        // The boxes already in the air adopt the new level's duration. Mutated in
        // place — `duration` only seeds a box's travel target at spawn, nothing
        // renders it, so this needs no re-render at all.
        for (const b of liveRef.current) b.duration = durationRef.current;
    }

    // ─── App state (background → auto-pause & open menu) ─────────────────────
    const onAppBackground = useCallback(() => {
        if (isLoseModal || isExitModal || buyModal !== null) return;
        // Drop any countdown in flight: it sits above the menu and would resume
        // the game behind it. Closing the menu starts a fresh 3·2·1 anyway.
        setIsCountdown(false);
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
                // The SFX pool is NOT released here: blur doesn't unmount the
                // screen, and the effect that loads it runs once ([] deps). The
                // old code released the players on every blur, so re-focusing
                // left the screen holding released instances that never played
                // again. Release belongs to the unmount effect.
            };
        }, [])
    );

    // SFX are loaded once in App for the whole app lifetime — this screen just
    // plays them. (It used to construct its own Sound objects here and release
    // them on blur, which left re-focused sessions silent.)
    useEffect(() => {
        const trackTimers = trackTimersRef.current;
        return () => {
            if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
            // The combo timer is cleared on the next tap, so a player who taps
            // and immediately leaves the screen left it armed to setCombo(0) on
            // an unmounted tree.
            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            // The ❄️ freeze timer is a wall-clock timeout that would otherwise
            // fire setFreezeActive on an unmounted tree.
            if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
            // Same for the aftermath timers: a player who taps and leaves within
            // the linger window left one armed to setTracks on an unmounted tree.
            trackTimers.forEach(clearTimeout);
            trackTimers.clear();
        };
    }, []);

    // A screen reader restores the per-box Pressables (PlayBox drops them
    // otherwise — the swipe layer is what ordinary play goes through).
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isScreenReaderEnabled()
            .then(on => { if (alive) setA11y(on); })
            .catch(() => {});
        const sub = AccessibilityInfo.addEventListener(
            'screenReaderChanged',
            on => setA11y(!!on),
        );
        return () => { alive = false; sub.remove(); };
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
    //
    // The one place a live box is *replaced* rather than mutated: its art is what
    // changes, so React has to re-render it, and a memoised row only re-renders on
    // a new object. Position rides along untouched (the copy carries the current
    // x/y), and the aftermath already on screen keeps the art it popped with.
    useEffect(() => {
        const next = liveRef.current.map(b => ({
            ...b,
            iconSvg: card.iconSvg,
            width: card.width,
            height: card.height,
            randomColors: card.randomColors,
            isRotation: card.isRotation,
            trackColor: card.trackColor,
        }));
        liveRef.current = next;
        setBoxesData(next);
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

            // Per-card travel direction (admin-managed). fromBottom → the box
            // floats UP and is "missed" when its top edge leaves the screen top;
            // otherwise it falls DOWN and is missed when its bottom passes the
            // screen bottom. The leading edge crosses the far boundary in both.
            const fromBottom = !!cardRef.current.fallFromBottom;
            const speed = 0.05 * effSlow();

            // The frame's real work: walk the live boxes, advance each one and
            // push its new style onto its own native view.
            //
            // Nothing here goes through React. The box objects ARE the game state
            // and they're mutated in place, so a frame costs the arithmetic plus
            // one native prop update per box — no per-box object, no new array, no
            // render of this screen, no reconciliation. (This is the same channel
            // Animated uses for a JS-driven animation; driving Animated values
            // instead would cost one update *per value*, so the style is written
            // whole.) React is only told when the LIST changes — a box spawns or
            // leaves — which is what `dropped` collects below.
            const list = liveRef.current;
            let dropped = false;
            let missed = false;

            for (let i = 0; i < list.length; i++) {
                const b = list[i];
                // Bombs (and the life pickup) reach further per frame than the
                // cards; the mine barrel reaches less — it's the heavy one.
                const boost = b.isBomb ? BOMB_FALL_BOOST
                    : b.isBarrel ? BARREL_FALL_BOOST
                        : b.isHeart ? HEART_FALL_BOOST : 1;
                const reach = (durationEffRef.current + 10) * boost;
                const oldX = b.x;
                const oldY = b.y;
                const newY = oldY + (b.ty - oldY) * speed;

                if (fromBottom ? newY < 0 : newY + b.size > height) {
                    // Off the far edge. Drop the box instead of teleporting it
                    // back: the spawner feeds the next one on its own cadence, so
                    // boxes keep arriving one at a time rather than in a re-synced
                    // batch.
                    b.__dead = true;
                    dropped = true;
                    // A trap (bomb or mine barrel) that leaves the screen
                    // untouched is the correct play — no heart, no shake. A missed
                    // bonus (money bag), the ❄️ freeze pickup or the life pickup is
                    // just a missed chance, not a mistake: it disappears without
                    // costing a heart either.
                    if (b.isBomb || b.isBarrel || b.isHeart || b.isGolden || b.isFreeze || b.isGift) continue;
                    // Deferred so a native call doesn't land on the frame's budget.
                    if (loseHeart()) deferFeedback(() => haptic('loseHeart'));
                    missed = true;
                    continue;
                }

                b.x = oldX + (b.tx - oldX) * speed;
                b.y = newY;
                b.tx = Math.abs(b.tx - oldX) < 1 ? Math.random() * (width - b.size) : b.tx;
                b.ty = fromBottom ? oldY - reach : oldY + reach;
                // Traps never spin — they drop upright so their tell (the lit
                // fuse, the mine trigger) stays on top. The barrel is the
                // exception: it rocks side to side, derived from its own height so
                // the wobble is smooth and needs no extra per-box state.
                b.rotation = b.isBarrel
                    ? Math.sin(newY * BARREL_WOBBLE_SPEED) * BARREL_WOBBLE_DEG
                    : (b.isRotation && !b.isBomb) ? (b.rotation + 2) % 360 : b.rotation;

                // Null until PlayBox has mounted the box (its first frame) and
                // again after it unmounts. Style props have to travel nested
                // under `style`, exactly as they were rendered — a bare
                // `transform` is not a view attribute and would be dropped.
                b.node?.setNativeProps({style: buildBoxStyle(b)});
            }

            if (dropped) {
                const next = list.filter((b: any) => !b.__dead);
                liveRef.current = next;
                setBoxesData(next);
            }

            if (missed) {
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
            return base / effSlow();
        };

        const spawnOne = () => {
            if (!isBossFightRef.current) {
                // The stream is normally bounded by how long a box takes to cross
                // the screen versus the spawn gap; MAX_CARD_BOXES is the floor
                // under that, and skipping the beat is the right answer — the next
                // one comes along a gap later, on cadence.
                addBox(
                    spawnBox(
                        cardRef.current,
                        durationEffRef.current,
                        !!cardRef.current.fallFromBottom,
                        false,   // isBomb
                        false,   // isHeart
                        false,   // isBarrel
                        false,   // isGift — gifts have their own spawner below
                        // ❄️ freeze pickups only start rolling after level 4.
                        levelRef.current >= FREEZE_MIN_LEVEL,
                    ),
                    MAX_CARD_BOXES,
                );
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
            effSlow();

        const spawnBomb = () => {
            // A full field is checked here rather than left to addBox: the level's
            // budget must not be spent on a box that never dropped.
            const eligible = !isBossFightRef.current && bombsLeftRef.current > 0 &&
                liveRef.current.length < MAX_LIVE_BOXES;

            if (eligible) {
                bombsLeftRef.current -= 1;
                addBox(spawnBox(cardRef.current, durationEffRef.current, !!cardRef.current.fallFromBottom, true));
            }
            // Keep ticking even when not eligible (boss fight, budget spent):
            // the next level refills the budget and the timer picks it up.
            timeoutId = setTimeout(spawnBomb, nextGap());
        };

        timeoutId = setTimeout(spawnBomb, nextGap());

        return () => clearTimeout(timeoutId);
    }, [isPlaying]);

    // Mine-barrel spawner — its own timer for the same reason the bomb has one:
    // the two traps must never share a beat, or they'd arrive as a pair and the
    // player would learn the rhythm instead of watching the screen. Gaps are
    // longer and the per-level budget is smaller, so a barrel is an event.
    useEffect(() => {
        if (!isPlaying) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const nextGap = () =>
            (BARREL_GAP_MIN_MS + Math.random() * (BARREL_GAP_MAX_MS - BARREL_GAP_MIN_MS)) /
            effSlow();

        const spawnBarrel = () => {
            const eligible =
                !isBossFightRef.current &&
                levelRef.current >= BARREL_MIN_LEVEL &&
                barrelsLeftRef.current > 0 &&
                liveRef.current.length < MAX_LIVE_BOXES;

            if (eligible) {
                barrelsLeftRef.current -= 1;
                addBox(spawnBox(
                    cardRef.current,
                    durationEffRef.current,
                    !!cardRef.current.fallFromBottom,
                    false,
                    false,
                    true,
                ));
            }
            // Keeps ticking while ineligible (early levels, boss fight, budget
            // spent) so the next level-up picks straight back up.
            timeoutId = setTimeout(spawnBarrel, nextGap());
        };

        timeoutId = setTimeout(spawnBarrel, nextGap());

        return () => clearTimeout(timeoutId);
    }, [isPlaying]);

    // 💰 Money-bag spawner — same shape as the hazard spawners, but for the bonus:
    // a per-level budget of MONEY_BAGS_PER_LEVEL and a long, re-randomised gap
    // before each one, so the level's three bags land spread out across it instead
    // of clustering. Keeps ticking while ineligible (boss fight, budget spent) so
    // the next level-up refills the budget and it picks straight back up.
    useEffect(() => {
        if (!isPlaying) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const nextGap = () =>
            (BAG_GAP_MIN_MS + Math.random() * (BAG_GAP_MAX_MS - BAG_GAP_MIN_MS)) /
            effSlow();

        const spawnBag = () => {
            const eligible = !isBossFightRef.current && bagsLeftRef.current > 0 &&
                liveRef.current.length < MAX_LIVE_BOXES;

            if (eligible) {
                bagsLeftRef.current -= 1;
                addBox(spawnBox(
                    cardRef.current,
                    durationEffRef.current,
                    !!cardRef.current.fallFromBottom,
                    false,   // isBomb
                    false,   // isHeart
                    false,   // isBarrel
                    false,   // isGift
                    false,   // allowFreeze
                    true,    // isBag
                ));
            }
            timeoutId = setTimeout(spawnBag, nextGap());
        };

        timeoutId = setTimeout(spawnBag, nextGap());

        return () => clearTimeout(timeoutId);
    }, [isPlaying]);

    // ─── Stable handler identities ────────────────────────────────────────────
    // The plain function declarations above get a fresh identity on every render.
    // Passing those straight to the memoised children would defeat the memo and
    // re-render every modal and helper button whenever anything on this screen
    // changes. These wrappers keep the prop identity fixed while still calling the
    // latest closure.
    const onMenu = useStableCallback(menuHandler);
    const onBossTap = useStableCallback(handleBossTap);
    const onRetry = useStableCallback(handleRetry);
    const onExitConfirm = useStableCallback(handleExitConfirm);
    const onExitCancel = useStableCallback(handleExitCancel);
    const onWatchAdLose = useStableCallback(handleWatchAd);
    const onMenuClose = useStableCallback(handleMenuClose);
    const onMenuExit = useStableCallback(handleMenuExit);
    const onCountdownFinish = useStableCallback(handleCountdownFinish);
    const onBuyHelper = useStableCallback(handleBuyHelper);
    const onWatchAdHelper = useStableCallback(handleWatchAdHelper);
    const onBuyModalClose = useStableCallback(() => {
        setBuyModal(null);
        setIsPlaying(true);
    });
    const onShieldPress = useStableCallback(() => {
        if (shieldCount > 0 && !shieldActive) {
            handleShield();
        } else if (!shieldActive) {
            setIsPlaying(false);
            setBuyModal('shield');
        }
    });
    const onBombPress = useStableCallback(() => {
        if (bombCount > 0) {
            handleBomb();
        } else {
            setIsPlaying(false);
            setBuyModal('bomb');
        }
    });
    const onSlowPress = useStableCallback(() => {
        if (slowCount > 0 && !slowActive) {
            handleSlow();
        } else if (!slowActive) {
            setIsPlaying(false);
            setBuyModal('slow');
        }
    });

    // ─── Swipe-to-tap ─────────────────────────────────────────────────────────
    // Tapping a box one at a time is only half the gesture players expect: press
    // anywhere and drag, and everything the finger crosses should pop. A per-box
    // Pressable can't do that — once a touch is granted to one view, the boxes it
    // slides over never hear about it (and a box that pops mid-drag drops the
    // responder entirely). So the arena gets ONE full-screen gesture layer that
    // owns the touch and hit-tests the field itself, on press and on every move.
    //
    // It sits above the boxes (same zIndex, rendered last) but below the menu
    // button, the helper row and the boss, so those keep their own presses. With a
    // screen reader on, PlayBox also brings back its per-box Pressable — that's
    // what a reader activates.
    //
    // The hit-test reads `liveRef`, the loop's own array, so it tests where the
    // boxes are *now* rather than a frame-old render snapshot.
    //
    // Boxes already popped by the current drag: a popped box leaves the live list
    // immediately, so this only guards a second sample within the same move event.
    const swipeHitsRef = useRef<Set<string>>(new Set());
    // Where each active finger landed, and whether it has popped anything yet.
    // A plain tap on a box that overlaps another used to pop BOTH: the very next
    // move sample — and a resting finger always jitters a pixel or two — found the
    // box *behind* it at the same point. So until a finger has travelled
    // SWIPE_MIN_DIST from where it landed the gesture is still a tap, and a tap
    // pops exactly one box. Past that it's a swipe and pops everything it crosses.
    const touchStartRef = useRef<Map<number, {x: number; y: number; popped: boolean}>>(new Map());

    const hitSwipe = useCallback((id: number, px: number, py: number) => {
        let start = touchStartRef.current.get(id);
        if (!start) {
            start = {x: px, y: py, popped: false};
            touchStartRef.current.set(id, start);
        } else if (start.popped) {
            const dx = px - start.x;
            const dy = py - start.y;
            if (dx * dx + dy * dy < SWIPE_MIN_DIST * SWIPE_MIN_DIST) return;
        }

        const list = liveRef.current;
        // renderedBoxes walks the list backwards, so index 0 is drawn frontmost —
        // walking forwards here means the first match is the box on top.
        for (let i = 0; i < list.length; i++) {
            const b = list[i];
            if (b.__dead || swipeHitsRef.current.has(b.id)) continue;
            const {w, h} = boxBounds(b);
            if (px >= b.x && px <= b.x + w && py >= b.y && py <= b.y + h) {
                swipeHitsRef.current.add(b.id);
                start.popped = true;
                handleTapRef.current(b);
                return;
            }
        }
    }, []);

    // Every active finger is tested, not just the one that started the gesture:
    // the layer is the sole responder now, so two-finger play has to come through
    // nativeEvent.touches or it would quietly stop working. Each is tracked by its
    // own identifier so one finger's tap/swipe state never gates another's.
    const onSwipeTouch = useCallback((e: any) => {
        const touches = e.nativeEvent?.touches;
        if (touches?.length) {
            for (let i = 0; i < touches.length; i++) {
                const t = touches[i];
                hitSwipe(t.identifier ?? i, t.locationX, t.locationY);
            }
        } else {
            const n = e.nativeEvent;
            hitSwipe(n.identifier ?? 0, n.locationX, n.locationY);
        }
    }, [hitSwipe]);

    const endSwipe = useCallback(() => {
        swipeHitsRef.current.clear();
        touchStartRef.current.clear();
    }, []);

    const swipeResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: onSwipeTouch,
        onPanResponderMove: onSwipeTouch,
        onPanResponderRelease: endSwipe,
        onPanResponderTerminate: endSwipe,
    }), [onSwipeTouch, endSwipe]);

    // ─── Render helpers ───────────────────────────────────────────────────────
    const comboLabel =
        combo >= 5 ? '🔥 INSANE!' :
            combo >= 4 ? '💥 MEGA!' :
                combo >= 3 ? '⚡ COMBO x' + combo :
                    '✨ COMBO x' + combo;


    const LevelUpIcon = level >= 10 ? FlameIcon : level >= 5 ? BoltIcon : StarBurstIcon;
    const levelUpColor = level >= 10 ? '#FF6B00' : level >= 5 ? '#FFD700' : '#ffffff';

    // Each modal returns null while hidden, so this block costs nothing to keep
    // mounted — but it is memoised anyway: it only depends on modal visibility and
    // the values they display, and the score/level state around it changes far
    // more often than that.
    const modals = useMemo(() => (
        <>
            <LoseModal
                visible={isLoseModal}
                score={count}
                onRetry={onRetry}
                onBack={onExitConfirm}
                onWatchAd={onWatchAdLose}
                canWatchAd={watchAdUsed < 2}
                adsEnabled={adsEnabled}
            />
            <ExitModal visible={isExitModal} onConfirm={onExitConfirm} onCancel={onExitCancel}/>
            <GameMenuModal visible={isMenuModal} onClose={onMenuClose} onExit={onMenuExit}/>
            {isCountdown && <CountdownOverlay onFinish={onCountdownFinish}/>}
            <BuyHelperModal
                visible={buyModal !== null}
                helperType={buyModal}
                coins={coins}
                watchAdUsed={watchAdUsed}
                onBuy={onBuyHelper}
                onWatchAd={onWatchAdHelper}
                adsEnabled={adsEnabled}
                onClose={onBuyModalClose}
            />
        </>
    ), [isLoseModal, count, watchAdUsed, adsEnabled, isExitModal, isMenuModal,
        isCountdown, buyModal, coins, onRetry, onExitConfirm, onExitCancel,
        onWatchAdLose, onMenuClose, onMenuExit, onCountdownFinish, onBuyHelper,
        onWatchAdHelper, onBuyModalClose]);

    // Boxes are drawn back-to-front (newest behind) — walking the list backwards
    // gets that with no throwaway array. Rebuilt only when the list itself changes
    // (a spawn or a departure), never while the boxes fall.
    const renderedBoxes = useMemo(() => {
        const out = [];
        for (let i = boxesData.length - 1; i >= 0; i--) {
            const box = boxesData[i];
            out.push(<PlayBox key={box.id} box={box} handlePress={onBoxPress} a11y={a11y}/>);
        }
        return out;
    }, [boxesData, onBoxPress, a11y]);

    // The aftermath of popped boxes — hole markers and blasts. Static art at a
    // fixed spot, drawn under the live boxes so a falling card is never hidden
    // behind the marker of the one before it.
    const renderedTracks = useMemo(
        () => tracks.map(t => <PlayBox key={t.id} box={t} handlePress={onBoxPress}/>),
        [tracks, onBoxPress],
    );

    // The three helper buttons carry SVG art and only change when a helper count
    // or active state does.
    const helpersRow = useMemo(() => (
                <View style={[styles.helpersRow, {bottom: insets.bottom + 22}, isBossFight && {opacity: 0.3, pointerEvents: 'none'}]}>

                    {/* Shield */}
                    <Animated.View style={{transform: [{scale: shieldCount > 0 && !shieldActive ? bombPulseAnim : 1}]}}>
                        <TouchableOpacity
                            onPress={onShieldPress}
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
                            onPress={onBombPress}
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
                            onPress={onSlowPress}
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
    ), [insets.bottom, isBossFight, shieldCount, shieldActive, bombCount,
        slowCount, slowActive, slowTimer, bombPulseAnim, t,
        onShieldPress, onBombPress, onSlowPress]);

    // ─── Game content ─────────────────────────────────────────────────────────
    const gameContent = (
        <Animated.View style={[styles.container, {transform: [{translateX: shakeAnim}]}]}>
            {/* Transparent, so whichever background the player has equipped runs
                all the way to the top of the screen — a painted bar would cut a
                hard line across an image or animated background. The arena is
                the one screen where that edge is worth losing.

                Safe because every element pinned to the top here (Level,
                Progress, the header row and CoinCount) is already positioned
                from insets.top, which now reports the real status bar height
                instead of 0. Lives in gameContent so all three background
                branches below get it. */}
            <ScreenStatusBar/>

            <View style={styles.zIndexStyle}>
                <Level level={level}/>
            </View>

            <View style={styles.zIndexStyle}>
                <Progress length={levelLength} coin={levelCount}/>
            </View>


            <View style={[styles.headerLeftView, {top: insets.top + TOP_OFFSET, zIndex: 2}]}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        onPress={onMenu}
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
                <CoinCount count={count} viewStyles={[styles.countView, {top: insets.top + TOP_OFFSET}]}/>
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

            {/* ❄️ Freeze badge */}
            {freezeActive && (
                <View pointerEvents="none" style={styles.freezeBadge}>
                    <Text allowFontScaling={false} style={styles.freezeText}>❄️ FROZEN</Text>
                </View>
            )}

            {/* 🎁 Gift reveal (win / boom pop) */}
            {giftReveal && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.giftRevealOverlay,{marginTop: 25}, {
                        opacity: giftRevealOpacityAnim,
                        transform: [{scale: giftRevealScaleAnim}],
                    }]}
                >
                    {giftReveal.kind === 'win'
                        ? <Coin width={44} height={48}/>
                        : <BombBlast size={44}/>}
                    <Text
                        allowFontScaling={false}
                        style={[
                            styles.giftRevealText,
                            {color: giftReveal.kind === 'win' ? '#FFD24A' : '#FF1744'},
                        ]}
                    >
                        {giftReveal.kind === 'win' ? `+${giftReveal.amount}` : 'BOOM!'}
                    </Text>
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
                    onTap={onBossTap}
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

            {helpersRow}

            {/* Shield active border */}
            {shieldActive && (
                <View pointerEvents="none" style={styles.shieldBorder}/>
            )}

            {/* ❄️ Frozen-field tint (steady while a freeze is live) */}
            {freezeActive && (
                <View pointerEvents="none" style={styles.freezeOverlay}/>
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

            {modals}

            {renderedTracks}

            {renderedBoxes}

            {/* Swipe layer — last child on purpose: it shares the boxes' zIndex,
                so rendering it after them puts it on top of the whole field while
                still passing under the menu button, helpers and boss. Only while
                the arena is live; a paused/countdown field must not react. */}
            {isPlaying && (
                <View style={styles.swipeLayer} {...swipeResponder.panHandlers}/>
            )}
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
