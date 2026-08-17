import { ShopItem } from '../services/types';
import { mediaUrl } from '../services/config';
import { loadShopArt, saveShopArt } from '../db/shopArtRepo';

// ── Shop visual registry ──────────────────────────────────────────────────────
// The backend owns the shop *catalog* (keys, prices, ownership, what is
// equipped). The mobile app owns how each key *looks*. This file is the bridge:
// every shop-item `key` the server can return maps to an on-device visual.
//
// Backgrounds are the exception, and deliberately so: a background is a picture
// an admin uploaded, plus the colours drawn under it while that picture loads —
// both from the catalog. So there is nothing per-background to declare here. A
// background the server invents tomorrow renders correctly on a build shipped
// today, and replacing one's artwork never needs an app release.
//
// Keys here must stay in sync with the backend seeder:
//   tabfingers-server/database/seeders/ShopItemsSeeder.php

export interface ShopVisual {
    // Drives <ShopItem> previews and <Play> falling-box rendering.
    typeName: string;
    // Card pixel size used by the Play screen.
    size?: number;
    isRotation?: boolean;
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
    // Backgrounds only, straight from the catalog: the uploaded picture as an
    // absolute URL, the colours painted under it, and the weather drawn over it.
    // Together they are the entire difference between one background and the
    // next.
    imageUrl?: string | null;
    colors?: string[];
    effect?: string | null;
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

    // ── Backgrounds ───────────────────────────────────────────────────────────
    // Not listed one by one on purpose — see the note at the top of the file.
    // A background's artwork arrives from the server, not from this build.
};

// Fallback visuals for keys the server knows but this build doesn't (e.g. a
// freshly-added catalog item shipped ahead of an app update).
const FALLBACK_CARD: ShopVisual = SHOP_VISUALS[DEFAULT_CARD_KEY];
const BACKGROUND_VISUAL: ShopVisual = { typeName: 'background' };

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
    // This background's whole appearance, as the backend defines it: the
    // uploaded picture (bg_image_path, served as bgImageUrl), the colours drawn
    // under it (bg_colors) and the weather over it (bg_effect). The picture is
    // cached as the *relative* URL the server returns — the API origin differs
    // between a dev build and a release, so resolving it at write time would
    // leave a cache that points at the wrong host after a rebuild.
    bgImageUrl?: string | null;
    bgColors?: string[] | null;
    bgEffect?: string | null;
}
let shopArtByKey: Record<string, ShopArt> = {};
// True once a live catalog has been registered this session, so a late cache
// read can't overwrite fresher server data.
let shopArtIsLive = false;

export function registerShopIcons(items: ShopItem[]): void {
    const next: Record<string, ShopArt> = {};
    for (const it of items) {
        next[it.key] = { iconSvg: it.iconSvg, width: it.width, height: it.height, randomColors: it.randomColors, rotateAnimation: it.rotateAnimation, fallFromBottom: it.fallFromBottom, trackColor: it.trackColor, bgImageUrl: it.bgImageUrl, bgColors: it.bgColors, bgEffect: it.bgEffect };
    }
    shopArtByKey = next;
    shopArtIsLive = true;
    saveShopArt(next);
}

// Restores the last-seen catalog artwork at launch. The equipped background is
// resolved from the cached profile before anything fetches the shop, and its
// picture lives on the server — without this the first paint would use the
// fallback colours and then jump once Play or the Shop refreshed the catalog.
export async function hydrateShopArt(): Promise<void> {
    if (shopArtIsLive) return;
    const cached = await loadShopArt<ShopArt>();
    if (cached && !shopArtIsLive) shopArtByKey = cached;
}

// What an entry paints: the uploaded picture, and the colours under it. Cards
// have neither — the fields exist on ShopEntry for the whole shop grid, and a
// card carrying a backdrop would be nonsense.
//
// The relative URL becomes absolute here, at the last moment, so the cache keeps
// holding the server's own value and a dev build and a release resolve the same
// cached entry against their own host.
//
// An empty list is dropped so BackgroundView's own ramp stands in; a single
// colour is passed through, because that is how the admin panel says "flat".
function backgroundArt(isCard: boolean, art: {
    bgImageUrl?: string | null;
    bgColors?: string[] | null;
    bgEffect?: string | null;
}) {
    if (isCard) return {};
    return {
        imageUrl: mediaUrl(art.bgImageUrl),
        colors: art.bgColors?.length ? art.bgColors : undefined,
        effect: art.bgEffect ?? undefined,
    };
}

// Merges a backend ShopItem with its visual into a UI-ready ShopEntry.
export function mergeShopItem(item: ShopItem): ShopEntry {
    const isCard = item.type === 'card';
    // Backgrounds all share one visual — the catalog artwork below is what tells
    // them apart.
    const visual = isCard ? (SHOP_VISUALS[item.key] ?? FALLBACK_CARD) : BACKGROUND_VISUAL;
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
        ...backgroundArt(isCard, item),
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
    const isCard = type === 'card';
    const resolvedKey = key && SHOP_VISUALS[key] ? key : defaultKey;
    const visual = isCard ? SHOP_VISUALS[resolvedKey] : BACKGROUND_VISUAL;
    // Admin-created skins aren't in SHOP_VISUALS, so `resolvedKey` falls back to
    // the default for the on-device visual — but the backend still has their
    // artwork (SVG + size), keyed by the *real* equipped key. Prefer that so a
    // custom card shows its own SVG/dimensions instead of the starter skin's.
    // For a background this registry IS its whole appearance: the equipped key
    // is looked up as-is, so a background the server added shows its own picture
    // even though this build has never heard of the key.
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
        ...backgroundArt(isCard, art),
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
