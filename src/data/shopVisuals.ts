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
    // Admin-authored inline SVG artwork (backend shop_items.icon_svg). When set,
    // the Shop renders this instead of the on-device card component.
    iconSvg?: string | null;
    // Admin-authored render size (backend shop_items.width/height). Consumed
    // only by the Play screen's falling card; the Shop preview ignores it.
    width?: number | null;
    height?: number | null;
    // Admin flag (backend shop_items.random_colors). When set, the Play screen
    // recolours each falling instance of this card's SVG to a random hue.
    randomColors?: boolean;
    // Admin flag (backend shop_items.fall_from_bottom). When set, the Play screen
    // spawns this card at the bottom and floats it up instead of falling down.
    fallFromBottom?: boolean;
    // Admin colour (backend shop_items.track_color) for the destroy burst in Play.
    trackColor?: string | null;
    // Admin flag (backend shop_items.coming_soon). When set, the Shop renders
    // this as a locked "coming soon" teaser that can't be bought or equipped.
    comingSoon?: boolean;
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

    // ── Coming-soon cards (admin-authored SVG artwork drives the preview) ──────
    card_phoenix: { typeName: 'card', size: 100, isRotation: false },
    card_crown: { typeName: 'card', size: 100, isRotation: false },
    card_lightning: { typeName: 'card', size: 100, isRotation: false },

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

    // ── Coming-soon backgrounds (premium gradients) ───────────────────────────
    bg_rainbow: { typeName: 'background', colors: ['#ff0040', '#ff8c00', '#ffe000', '#00d26a', '#0088ff', '#8a2be2'] },
    bg_nebula: { typeName: 'background', colors: ['#0b0033', '#2a0a5e', '#5e1a8a', '#b13aa6', '#ff6ec7'] },
    bg_mirage: { typeName: 'background', colors: ['#1a0d00', '#5e3a00', '#a86a1a', '#e0a850', '#ffe0a0'] },

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

// Admin-authored artwork (SVG + optional render size), keyed by shop-item key.
// Populated from the shop catalog via registerShopIcons() so the key-only
// resolvers below (used by Home/Play, which don't have the full server item)
// can surface the same icon/dimensions the backend defines for the equipped card.
interface ShopArt {
    iconSvg?: string | null;
    width?: number | null;
    height?: number | null;
    randomColors?: boolean;
    rotateAnimation?: boolean;
    fallFromBottom?: boolean;
    trackColor?: string | null;
}
let shopArtByKey: Record<string, ShopArt> = {};

export function registerShopIcons(items: ShopItem[]): void {
    const next: Record<string, ShopArt> = {};
    for (const it of items) {
        next[it.key] = { iconSvg: it.iconSvg, width: it.width, height: it.height, randomColors: it.randomColors, rotateAnimation: it.rotateAnimation, fallFromBottom: it.fallFromBottom, trackColor: it.trackColor };
    }
    shopArtByKey = next;
}

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
        // Admin "rotate animation" flag is the sole authority for the falling-card
        // spin — a card rotates only when the admin has enabled it.
        isRotation: item.rotateAnimation,
        images: visual.images,
        colors: visual.colors,
        animationType: visual.animationType,
        isRare: visual.isRare,
        isPremium: item.isPremium,
        iconSvg: item.iconSvg ?? null,
        width: item.width ?? null,
        height: item.height ?? null,
        randomColors: item.randomColors ?? false,
        fallFromBottom: item.fallFromBottom ?? false,
        trackColor: item.trackColor ?? null,
        comingSoon: item.comingSoon ?? false,
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
    // Admin-created skins aren't in SHOP_VISUALS, so `resolvedKey` falls back to
    // the default for the on-device visual — but the backend still has their
    // artwork (SVG + size), keyed by the *real* equipped key. Prefer that so a
    // custom card shows its own SVG/dimensions instead of the starter skin's.
    const art = (key && shopArtByKey[key]) || shopArtByKey[resolvedKey] || {};
    return {
        id: key || resolvedKey,
        key: key || resolvedKey,
        serverId: -1,
        title: key || resolvedKey,
        coins: '0',
        priceCoins: 0,
        type,
        typeName: visual.typeName,
        size: visual.size,
        // Admin "rotate animation" flag (registered by key) is the sole authority
        // for the spin — a card rotates only when the admin has enabled it.
        isRotation: art.rotateAnimation ?? false,
        images: visual.images,
        colors: visual.colors,
        animationType: visual.animationType,
        isRare: visual.isRare,
        isPremium: false,
        iconSvg: art.iconSvg ?? null,
        width: art.width ?? null,
        height: art.height ?? null,
        randomColors: art.randomColors ?? false,
        fallFromBottom: art.fallFromBottom ?? false,
        trackColor: art.trackColor ?? null,
    };
}

export function resolveCardEntry(key?: string | null): ShopEntry {
    return entryFromKey(key, 'card', DEFAULT_CARD_KEY);
}

export function resolveBackgroundEntry(key?: string | null): ShopEntry {
    return entryFromKey(key, 'background', DEFAULT_BG_KEY);
}
