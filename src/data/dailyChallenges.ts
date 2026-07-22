// ── Daily challenges catalog (client-only) ────────────────────────────────────
// Unlike the server-driven challenges on the Challenges screen, these three are
// tracked entirely on-device (see dailyChallengesStore). Progress advances from
// gameplay and resets on a rolling 24h window per player. Because there is no
// backend for them, the claimed reward is added to a device-local coin bonus.

export type DailyChallengeType = 'games' | 'coins' | 'level';

export interface DailyChallengeDef {
    id: string;
    type: DailyChallengeType;
    // i18n key for the card title.
    titleKey: string;
    // Emoji shown in the card's icon box while the challenge is in progress.
    icon: string;
    // Goal the player must reach within the current 24h cycle.
    target: number;
    // Coins granted (to the on-device bonus) when the challenge is claimed.
    rewardCoins: number;
}

// Order here is the order shown on the screen.
export const DAILY_CHALLENGES: DailyChallengeDef[] = [
    // Play 10 games today — one increment per finished game.
    {id: 'daily_games', type: 'games', titleKey: 'dailyGamesTitle', icon: '🎮', target: 10,   rewardCoins: 100},
    // Collect 1000 coins today — sums the coins banked across today's games.
    {id: 'daily_coins', type: 'coins', titleKey: 'dailyCoinsTitle', icon: '🪙', target: 1000, rewardCoins: 150},
    // Reach level 10 today — tracks the best level reached in any of today's games.
    {id: 'daily_level', type: 'level', titleKey: 'dailyLevelTitle', icon: '🏆', target: 10,   rewardCoins: 120},
];
