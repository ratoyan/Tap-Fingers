// utils/storageKeys.js
export const STORAGE_KEYS = {
    LANG: 'lang',
    MUSIC: 'music',
    SOUND: 'sound',
    VIBRATION: 'vibration',
    COIN: 'coin',
    CARDID: 'cardId',
    BACKGROUNDID: 'backgroundId',
    CARDSID: 'cardsId',
    BACKGROUNDSID: 'backgroundsId',
    AUTH_TYPE: 'auth_type',  // 'google' | 'apple' | 'guest'
    BOMB_COUNT:      'bomb_count',
    SLOW_COUNT:      'slow_count',
    SHIELD_COUNT:    'shield_count',
    LUCKY_SPIN_DATE: 'lucky_spin_date',
    DAILY_AD_WATCHES: 'daily_ad_watches',
    LAST_REVIEW_DATE: 'last_review_date',
    PROFILE_PHOTO:    'profile_photo',  // device-local profile picture (no backend)
    // Daily challenges are a device-local feature (no backend): the player's
    // per-cycle progress and the coins earned from claiming them both live only
    // on this device — same "no backend" pattern as PROFILE_PHOTO above.
    DAILY_CHALLENGES: 'daily_challenges',   // {periodStart, items:{id:{current,claimed}}}
    DAILY_BONUS_COINS: 'daily_bonus_coins', // coins granted by claimed daily challenges
};
