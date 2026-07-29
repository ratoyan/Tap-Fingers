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
    // Daily challenge progress is tracked device-locally (no backend notion of
    // the rolling 24h cycle), but the coins a claim pays out ARE credited
    // server-side via POST /player/daily-bonus.
    DAILY_CHALLENGES: 'daily_challenges',    // {periodStart, items:{id:{current,claimed}}}
    DAILY_BONUS_COINS: 'daily_bonus_coins',  // claimed coins the server hasn't credited yet
    DAILY_BONUS_PENDING: 'daily_bonus_pending', // claims queued for the backend (offline retry)
    // Legacy: shop items bought on-device back when daily-challenge coins never
    // reached the backend. Read-only now — the Shop still unions these into the
    // owned set so those purchases aren't lost, but nothing writes new ones.
    LOCAL_OWNED_ITEMS: 'local_owned_items', // string[] of shop item keys
};
