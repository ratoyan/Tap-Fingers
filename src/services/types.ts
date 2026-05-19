// ── Shared API types ──────────────────────────────────────────────────────────
// Mirrors the TapFingers backend (back-ends/tapfingers-server) JSON shapes.
// The backend wraps every response as { success, message, data }; `api.ts`
// returns the raw axios response, so services unwrap `res.data.data`.

export type AccountType = 'guest' | 'google' | 'email' | 'apple';
export type ShopItemType = 'card' | 'background' | 'power_up';
export type ChallengeType = 'taps' | 'score' | 'level' | 'purchase' | 'streak' | 'games';
export type HelperType = 'bomb' | 'slow' | 'shield';

export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PlayerStats {
    id: number;
    playerId: string;
    coins: number;
    gems: number;
    highScore: number;
    totalScore: number;
    totalTaps: number;
    totalGames: number;
    totalTimeSecs: number;
    currentLevel: number;
    xp: number;
    activeCardKey: string;
    activeBackgroundKey: string;
    winStreak: number;
    bombCount: number;
    slowCount: number;
    shieldCount: number;
    lastLuckySpinAt: string | null;
    dailyAdCount: number;
    dailyAdDate: string | null;
}

export interface Player {
    id: string;
    username: string | null;
    email: string | null;
    accountType: AccountType;
    googlePlayId?: string | null;
    guestId?: string | null;
    appleId?: string | null;
    isActive?: boolean;
    isBanned?: boolean;
    lastLoginAt?: string | null;
    createdAt?: string;
    stats?: PlayerStats;
}

// `formatPlayer()` on the backend returns this compact shape on auth responses.
export interface AuthPlayer {
    id: string;
    username?: string | null;
    email?: string | null;
    accountType: AccountType;
    coins?: number;
    highScore?: number;
    level?: number;
    guestId?: string;
}

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    player: AuthPlayer;
    merged?: boolean;
}

export interface ShopItem {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: ShopItemType;
    priceCoins: number;
    priceGems: number;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    isPremium: boolean;
}

export interface InventoryEntry {
    id: number;
    playerId: string;
    shopItemId: number;
    isActiveCard: boolean;
    isActiveBackground: boolean;
    purchasedAt: string;
    item: ShopItem;
}

export interface Challenge {
    id: number;
    title: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    rewardCoins: number;
    rewardGems: number;
    durationHours: number | null;
    sortOrder: number;
    isActive: boolean;
}

export interface ChallengeProgress {
    current: number;
    isCompleted: boolean;
    isRewardClaimed: boolean;
}

export interface ChallengeWithProgress extends Challenge {
    progress: ChallengeProgress;
}

export interface ScoreEntry {
    id: number;
    username: string;
    score: number;
    taps: number;
    levelReached: number;
    maxCombo: number;
    coinsEarned?: number;
    createdAt: string;
}

export interface Leaderboard {
    scores: ScoreEntry[];
    total: number;
    page: number;
    totalPages: number;
}

export interface GameConfig {
    INITIAL_LIVES: number;
    TAPS_PER_LEVEL: number;
    MAX_ACTIVE_LEVEL: number;
    MAX_SESSION_SECS: number;
    MIN_SESSION_SECS: number;
    BASE_COIN_PER_TAP: number;
    LEVEL_COIN_BONUS: number;
    COMBO_THRESHOLDS: number[];
    COMBO_MULTIPLIERS: number[];
    BOX_TYPES: string[];
    BACKGROUND_THRESHOLDS: number[];
    SPAWN_INTERVAL_MS: Record<string, number>;
    FALL_DURATION_MS: Record<string, number>;
}

export interface GameStartResult {
    sessionToken: string;
    config: GameConfig;
    player: { username: string; activeCard: string; activeBg: string };
    helpers: { bomb: number; slow: number; shield: number };
}

export interface ChallengeCompletion {
    id: number;
    title: string;
    rewardCoins: number;
    rewardGems: number;
}

export interface GameEndResult {
    verified: boolean;
    coinsEarned: number;
    score: number;
    levelReached: number;
    newHighScore: boolean;
    totalCoins: number;
    challengesCompleted: ChallengeCompletion[];
}

export interface Profile {
    player: Player;
    stats: PlayerStats;
    inventory: InventoryEntry[];
}

export interface AdRewardResult {
    coinsEarned: number;
    totalCoins: number;
    adsRemaining: number;
}

export interface LuckyWheelPrize {
    type: 'coins' | HelperType;
    value: number;
}

export interface LuckyWheelSegment {
    index: number;
    type: 'coins' | HelperType;
    value: number;
}

export interface LuckyWheelResult {
    index: number;
    prize: LuckyWheelPrize;
    stats: { coins: number; bombCount: number; slowCount: number; shieldCount: number };
}

export interface HelperPurchaseResult {
    type: HelperType;
    count: number;
    remainingCoins: number;
}
