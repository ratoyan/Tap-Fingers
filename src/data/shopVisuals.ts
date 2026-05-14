import { ShopItem } from '../services/types';

// ── Shop visual registry ──────────────────────────────────────────────────────
// The backend owns the shop *catalog* (keys, prices, ownership, what is
// equipped). The mobile app owns how each key *looks*. This file is the bridge:
// every shop-item `key` the server can return maps to an on-device visual.
//
// Keys here must stay in sync with the backend seeder:
//   back-ends/tapfingers-server/src/database/seeders/001-shop-items.js

const bg1 = require('../assets/images/background1.jpg');
const bg2 = require('../assets/images/background2.jpg');
const bg3 = require('../assets/images/background3.jpg');
const bg4 = require('../assets/images/background4.jpg');

export interface ShopVisual {
    // Drives <ShopItem> previews and <Play> falling-box rendering.
    typeName: string;
    // Card pixel size used by the Play screen.
    size?: number;
    isRotation?: boolean;
    // Background variants — exactly one of these is set per background.
    images?: any[];
    colors?: string[];
    animationType?: string;
    isRare?: boolean;
}

// A backend ShopItem merged with its on-device visual. Shaped to stay
// drop-in compatible with the legacy `ShopType` the UI components expect.
export interface ShopEntry {
    id: string;         // backend key — stable id for selection + server calls
    key: string;
    serverId: number;   // backend numeric id
    title: string;
    coins: string;      // priceCoins rendered as string (UI expects a string)
    priceCoins: number;
    type: 'card' | 'background';
    typeName: string;
    size?: number;
    isRotation?: boolean;
    images?: any[];
    colors?: string[];
    animationType?: string;
    isRare?: boolean;
    isPremium: boolean;
}

export const DEFAULT_CARD_KEY = 'card_default';
export const DEFAULT_BG_KEY = 'bg_default';

export const SHOP_VISUALS: Record<string, ShopVisual> = {
    // ── Cards ─────────────────────────────────────────────────────────────────
    card_default: { typeName: 'card', size: 100, isRotation: false },
    card_balloon: { typeName: 'ballon', size: 130, isRotation: false },
    card_square: { typeName: 'square', size: 100, isRotation: true },
    card_star: { typeName: 'star', size: 100, isRotation: true },
    card_heart: { typeName: 'heart', size: 100, isRotation: false },
    card_diamond: { typeName: 'diamond', size: 100, isRotation: false },
    card_bomb: { typeName: 'bomb', size: 100, isRotation: false },
    card_ghost: { typeName: 'ghost', size: 100, isRotation: false },

    // ── Image backgrounds ─────────────────────────────────────────────────────
    bg_default: { typeName: 'background', images: [bg1, bg2, bg3, bg4, bg1] },
    bg_classic2: { typeName: 'background', images: [bg2, bg3, bg4, bg1, bg2] },
    bg_classic3: { typeName: 'background', images: [bg3, bg4, bg1, bg2, bg3] },
    bg_classic4: { typeName: 'background', images: [bg4, bg1, bg2, bg3, bg4] },

    // ── Colour-gradient backgrounds ───────────────────────────────────────────
    bg_night: { typeName: 'background', colors: ['#03001C', '#06003a', '#090058', '#0c0076', '#0f0094'] },
    bg_forest: { typeName: 'background', colors: ['#0a2e12', '#0d3a16', '#10461a', '#13521e', '#165e22'] },
    bg_ice: { typeName: 'background', colors: ['#001a33', '#003d66', '#005f99', '#0080cc', '#00a3ff'] },
    bg_ocean: { typeName: 'background', colors: ['#000d1a', '#001a33', '#00264d', '#003366', '#004080'] },
    bg_sunset: { typeName: 'background', colors: ['#1a0533', '#6b1a4a', '#b23a2e', '#d4622a', '#e8872a'] },
    bg_volcano: { typeName: 'background', colors: ['#2e0a03', '#3d0d04', '#4c1005', '#5b1306', '#6a1607'] },
    bg_fire: { typeName: 'background', colors: ['#1a0000', '#4d0000', '#800000', '#b33000', '#cc5200'] },
    bg_galaxy: { typeName: 'background', colors: ['#04001a', '#0d0033', '#1a004d', '#280066', '#360080'] },
    bg_neon: { typeName: 'background', colors: ['#0d001a', '#1a0033', '#33004d', '#4d0066', '#660080'] },

    // ── Animated backgrounds ──────────────────────────────────────────────────
    bg_starfield: { typeName: 'background', animationType: 'stars', isRare: true },
    bg_matrix: { typeName: 'background', animationType: 'matrix', isRare: true },
    bg_inferno: { typeName: 'background', animationType: 'inferno', isRare: true },
    bg_aurora: { typeName: 'background', animationType: 'aurora', isRare: true },
};

// Fallback visuals for keys the server knows but this build doesn't (e.g. a
// freshly-added catalog item shipped ahead of an app update).
const FALLBACK_CARD: ShopVisual = SHOP_VISUALS[DEFAULT_CARD_KEY];
const FALLBACK_BG: ShopVisual = SHOP_VISUALS[DEFAULT_BG_KEY];

// Merges a backend ShopItem with its visual into a UI-ready ShopEntry.
export function mergeShopItem(item: ShopItem): ShopEntry {
    const isCard = item.type === 'card';
    const visual = SHOP_VISUALS[item.key] ?? (isCard ? FALLBACK_CARD : FALLBACK_BG);
    return {
        id: item.key,
        key: item.key,
        serverId: item.id,
        title: item.name,
        coins: String(item.priceCoins),
        priceCoins: item.priceCoins,
        type: isCard ? 'card' : 'background',
        typeName: visual.typeName,
        size: visual.size,
        isRotation: visual.isRotation,
        images: visual.images,
        colors: visual.colors,
        animationType: visual.animationType,
        isRare: visual.isRare,
        isPremium: item.isPremium,
    };
}

// Builds a gameplay-ready entry straight from a key. Used by Home/Play, which
// only need the visual (title/price are irrelevant there). The backend's
// PlayerStats defaults equipped keys to the literal 'default', so that and any
// unknown key fall back to the starter skin.
function entryFromKey(
    key: string | null | undefined,
    type: 'card' | 'background',
    defaultKey: string,
): ShopEntry {
    const resolvedKey = key && SHOP_VISUALS[key] ? key : defaultKey;
    const visual = SHOP_VISUALS[resolvedKey];
    return {
        id: resolvedKey,
        key: resolvedKey,
        serverId: -1,
        title: resolvedKey,
        coins: '0',
        priceCoins: 0,
        type,
        typeName: visual.typeName,
        size: visual.size,
        isRotation: visual.isRotation,
        images: visual.images,
        colors: visual.colors,
        animationType: visual.animationType,
        isRare: visual.isRare,
        isPremium: false,
    };
}

export function resolveCardEntry(key?: string | null): ShopEntry {
    return entryFromKey(key, 'card', DEFAULT_CARD_KEY);
}

export function resolveBackgroundEntry(key?: string | null): ShopEntry {
    return entryFromKey(key, 'background', DEFAULT_BG_KEY);
}
