import React, {useMemo} from "react";
import {Pressable, Text, View, ViewStyle} from "react-native";
import {SvgAst, parse} from "react-native-svg";
import i18n from "../../../localization/i18n.ts";
import {DARK_NAVY} from "../../../constants/colors.ts";

// icons
import Card1 from "../../../assets/icons/Card1";
import TrackIcon from "../../../assets/icons/TrackIcon";
import {FallingBomb, BombBlast} from "../../../assets/icons/FallingBomb";
import {MineBarrel, BarrelBlast, BARREL_ART_SCALE} from "../../../assets/icons/MineBarrel";
import {MoneyBag} from "../../../assets/icons/MoneyBag";
import {HeartPlus} from "../../../assets/icons/HeartPlus";
import {GiftBox} from "../../../assets/icons/GiftBox";

interface PlayBoxProps {
    box: any;
    handlePress: (box: any) => void;
    // Only a screen reader needs the per-box Pressable: ordinary play goes
    // through the full-screen swipe layer in Play, which hit-tests the field
    // itself. A Pressable is a responder-owning native view per falling box, so
    // when nothing is listening it's paid for and never used — with it off the
    // boxes are plain Views.
    a11y?: boolean;
}

// Vibrant hues used when a card is flagged "random colors" in admin.
const RANDOM_COLORS = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE',
    '#40C4FF', '#18FFFF', '#69F0AE', '#00E676', '#FFD740', '#FFAB40', '#FF6E40',
];

// ─── SVG caches ──────────────────────────────────────────────────────────────
// Turning an admin SVG string into react-native-svg's element tree is the most
// expensive thing a spawning box does, and `SvgXml` re-parses on every mount —
// so at a fast level the game paid for the same parse several times a second and
// every spawn landed as a dropped frame. The art only ever comes from a handful
// of skins, so parse once per distinct string and hand every box the same tree
// (the AST holds immutable element descriptors — mounting it in many places at
// once is fine). Same story for the recolour regexes: cached per colour.
const AST_CACHE = new Map<string, any>();
const TINT_CACHE = new Map<string, string>();
// A skin swap or an admin edit can introduce new strings over a long session, so
// the maps are bounded. Wholesale clear rather than a real LRU: a miss only
// costs one re-parse, and the working set is a couple of entries.
const CACHE_MAX = 48;

function cached<T>(map: Map<string, T>, key: string, make: () => T): T {
    if (map.has(key)) return map.get(key) as T;
    const made = make();
    if (map.size >= CACHE_MAX) map.clear();
    map.set(key, made);
    return made;
}

// Stable colour per box: same id → same hue for the box's whole lifetime
// (ids survive the fall-animation reset), so a card doesn't flicker colour.
function pickColor(id: string): string {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return RANDOM_COLORS[h % RANDOM_COLORS.length];
}

// Recolours every concrete fill/stroke in an SVG to `color` so a "random colors"
// card renders in one random hue regardless of how its artwork was authored.
// `none`/`transparent` are preserved so cut-outs and outlines stay intact.
function tintSvg(xml: string, color: string): string {
    return cached(TINT_CACHE, `${color}|${xml}`, () =>
        xml
            .replace(/(fill|stroke)\s*=\s*"(?!none|transparent)[^"]*"/gi, `$1="${color}"`)
            .replace(/(fill|stroke)\s*=\s*'(?!none|transparent)[^']*'/gi, `$1='${color}'`)
            .replace(/(fill|stroke)\s*:\s*(?!none|transparent)[^;"']+/gi, `$1:${color}`),
    );
}

function parseSvg(xml: string): any {
    return cached(AST_CACHE, xml, () => {
        try {
            return parse(xml);
        } catch {
            return null;
        }
    });
}

// ─── Placement ───────────────────────────────────────────────────────────────
// Screen placement for a falling box, by variant.
//
// This is what the game loop drives. Positions no longer go through React state:
// the loop mutates the box and writes the style built below straight onto the
// box's native view every frame (see the animation loop in Play.tsx). A box is
// only re-rendered when its art changes — and since the object is mutated in
// place, such a render still paints the box where it currently is.
const spinOf = (box: any): any[] =>
    (box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : [];

// Rotation pivots around the artwork's centre: shift to the centre, turn, shift
// back. With no rotation the two shifts cancel, so the four-entry form is dropped
// for the plain translate it works out to — this is rebuilt and pushed across to
// the native view for every box on every frame, and most cards never spin.
function pivot(box: any, w: number, h: number, spin: any[]): ViewStyle["transform"] {
    if (!spin.length) {
        return [{translateX: box.x}, {translateY: box.y}] as ViewStyle["transform"];
    }
    return [
        {translateX: box.x + w / 2},
        {translateY: box.y + h / 2},
        ...spin,
        {translateX: -w / 2},
        {translateY: -h / 2},
    ] as ViewStyle["transform"];
}

// Branch order mirrors the render below exactly — a box must never be drawn by
// one variant and positioned by another.
function buildBoxTransform(box: any): ViewStyle["transform"] {
    const size = box.size || 100;

    // The barrel is drawn wider than its box and rocks as it falls, so it pivots
    // on its own artwork size and always carries the angle.
    if (box.isBarrel) {
        const s = Math.round(size * BARREL_ART_SCALE);
        return pivot(box, s, s, [{rotate: `${box.rotation || 0}deg`}]);
    }
    // Traps and pickups drop upright — no pivot maths needed.
    if (box.isBomb || box.isHeart || box.isFreeze || box.isGift) {
        return [{translateX: box.x}, {translateY: box.y}] as ViewStyle["transform"];
    }
    if (box.isGolden) return pivot(box, size, size, spinOf(box));
    if (typeof box.iconSvg === "string" && box.iconSvg.trim()) {
        return pivot(box, box.width || size, box.height || size, spinOf(box));
    }
    // Square and default cards both pivot on the box size.
    return pivot(box, size, size, spinOf(box));
}

// A square card's size is rolled once and kept on the box: the box outlives this
// component instance (its art can be re-created, and its popped copy draws the
// hole marker), and a fresh roll there would resize the card mid-flight.
function squareSizeOf(box: any): [number, number] {
    if (!box.__squareSize) {
        const random = Math.floor(Math.random() * 50) + 101;
        box.__squareSize = [random, random];
    }
    return box.__squareSize;
}

// True only for the box the `square` branch below actually draws — every special
// and the admin SVG win over the card art, so they're ruled out first.
function isSquareCard(box: any): boolean {
    if (box.isBarrel || box.isBomb || box.isHeart || box.isFreeze || box.isGift || box.isGolden) return false;
    if (typeof box.iconSvg === "string" && box.iconSvg.trim()) return false;
    return (box?.typeName?.toLowerCase?.() ?? "") === "square";
}

// The complete style of a live (falling) box.
//
// Exported for the game loop: it hands this straight to the box's native view
// every frame (`setNativeProps({style})`) instead of re-rendering. It's the whole
// style, not just the transform, so what the loop pushes is exactly what a render
// would have committed — the two can't disagree about a box.
export function buildBoxStyle(box: any): ViewStyle {
    const style: ViewStyle = {
        position: "absolute",
        zIndex: 1,
        transform: buildBoxTransform(box),
    };
    if (!isSquareCard(box)) return style;
    const [w, h] = squareSizeOf(box);
    return {...style, width: w, height: h, backgroundColor: box.color || "blue", borderRadius: 10};
}

function PlayBox({box, handlePress, a11y}: PlayBoxProps) {

    const typeName = box?.typeName?.toLowerCase?.() ?? "";

    // When the card is flagged "random colors" (admin), give this box a stable
    // random hue and recolour its SVG art to match. Computed unconditionally so
    // the hooks run on every render regardless of which art branch is taken.
    const randomColor = useMemo(() => pickColor(String(box.id)), [box.id]);
    const tintedSvg = useMemo(
        () => (box.randomColors && typeof box.iconSvg === "string"
            ? tintSvg(box.iconSvg, randomColor)
            : box.iconSvg),
        [box.iconSvg, box.randomColors, randomColor],
    );
    // The artwork is the expensive part of a falling box — an admin SVG is dozens
    // of nodes, and Card1/MoneyBag/… are SVGs too. None of it changes while a box
    // falls; only its position does, and that no longer goes through React at all
    // (the loop writes the new style onto the native view). So these elements are
    // built once per box and the box only re-renders when its art really changes.
    //
    // Sizes are hoisted here (not read inside the branches) so these hooks always
    // run in the same order, whichever art branch is taken below. Elements for
    // branches that aren't taken are merely created, never mounted — harmless.
    const artSize = box.size || 100;
    const svgW = box.width || box.size || 100;
    const svgH = box.height || box.size || 100;
    // Admin-set width/height fill the box exactly (stretch); without them,
    // keep the artwork's own aspect ratio.
    const hasAdminDims = !!(box.width || box.height);

    // Parsed once per distinct SVG string across the whole session (AST_CACHE),
    // so the tenth balloon of a level costs a mount and nothing more.
    const svgAst = useMemo(
        () => (typeof tintedSvg === "string" && tintedSvg.trim() ? parseSvg(tintedSvg) : null),
        [tintedSvg],
    );
    const svgArt = useMemo(
        () => (
            <SvgAst ast={svgAst} override={{
                width: svgW,
                height: svgH,
                color: box.randomColors ? randomColor : undefined,
                preserveAspectRatio: hasAdminDims ? "none" : "xMidYMid meet",
            }}/>
        ),
        [svgAst, svgW, svgH, box.randomColors, randomColor, hasAdminDims],
    );
    const cardArt = useMemo(() => <Card1 width={100} height={100}/>, []);
    const bombArt = useMemo(() => <FallingBomb size={artSize}/>, [artSize]);
    // The barrel is drawn a touch larger than the bomb — a heavier hazard should
    // look heavier, and the extra bulk keeps the two apart at a glance.
    const barrelSize = Math.round(artSize * BARREL_ART_SCALE);
    const barrelArt = useMemo(() => <MineBarrel size={barrelSize}/>, [barrelSize]);
    const bagArt = useMemo(() => <MoneyBag size={artSize}/>, [artSize]);
    const heartArt = useMemo(() => <HeartPlus size={artSize}/>, [artSize]);
    // ❄️ Freeze pickup — the plain snowflake emoji, sized to the box.
    const freezeArt = useMemo(() => (
        <Text allowFontScaling={false}
            style={{fontSize: Math.round(artSize * 0.82), lineHeight: artSize, textAlign: "center", width: artSize}}>
            ❄️
        </Text>
    ), [artSize]);
    // 🎁 Mystery gift box — its own SVG art, sized to the box.
    const giftArt = useMemo(() => <GiftBox size={artSize}/>, [artSize]);

    // Popped boxes (the hole marker, a blast) sit where they were hit and never
    // move again, so they only need the placement — no zIndex, as before.
    const trackStyle: ViewStyle = {position: "absolute", transform: buildBoxTransform(box)};

    // Hands the loop the native view to drive. Assigned onto the box itself:
    // the box object *is* the game entity the loop walks, so the view it owns
    // belongs on it (React passes null here on unmount, which clears it).
    const takeNode = (node: any) => { box.node = node; };

    // Live boxes are plain Views: the swipe layer in Play owns the touch and
    // hit-tests the field, so a per-box responder is dead weight. With a screen
    // reader on, the Pressable comes back — that's what gets activated.
    //
    // The style is the same object the loop will push from here on, so the box's
    // first painted frame and every frame after it come from one place.
    // `labelKey` is resolved through i18n only on the screen-reader path — this
    // is the hottest component in the game (one instance per falling box) and a
    // useTranslation() subscription per box would be paid on every render for a
    // string that ordinary play never reads. The instance is used directly for
    // the same reason; the language can only change from Settings, never while
    // the arena is live.
    const wrap = (children: React.ReactNode, labelKey: string) => {
        const style = buildBoxStyle(box);
        return a11y ? (
            <Pressable
                ref={takeNode}
                onPressIn={() => handlePress(box)}
                style={style}
                accessibilityRole="button"
                accessibilityLabel={i18n.t(labelKey)}
            >
                {children}
            </Pressable>
        ) : (
            <View ref={takeNode} style={style}>
                {children}
            </View>
        );
    };

    // 🛢️ Mine barrel — the second hazard. Checked before isBomb so the two flags
    // can never both win a render, and before the card art for the same reason
    // the bomb is: a trap must always look like a trap, whatever skin is equipped.
    // Like the bomb it drops upright — the mine trigger belongs on top.
    if (box.isBarrel) {
        return box.isBoom ? (
            <View style={trackStyle}>
                <BarrelBlast size={barrelSize}/>
            </View>
        ) : wrap(barrelArt, "dontTapBarrel");
    }

    // 💣 Hazard bomb — wins over every card art (admin SVG included) so the
    // trap always reads as a bomb, whatever skin the player has equipped. It is
    // never golden; its own red halo does the highlighting.
    if (box.isBomb) {
        return box.isBoom ? (
            <View style={trackStyle}>
                <BombBlast size={artSize}/>
            </View>
        ) : wrap(bombArt, "dontTapBomb");
    }

    // ❤️ Life pickup — falls only when the player has a heart to win back.
    // Like the bag, it leaves no track behind when tapped.
    if (box.isHeart) {
        if (box.isBoom) return null;
        return wrap(heartArt, "tapHeart");
    }

    // ❄️ Freeze pickup — rendered by its own cyan snowflake art and, like the
    // bag, it leaves no track behind when tapped. Drawn upright (no spin).
    if (box.isFreeze) {
        if (box.isBoom) return null;
        return wrap(freezeArt, "tapSnowflake");
    }

    // 🎁 Mystery gift box — a gamble tapped for a random reward or a boom. Wins
    // over the card/admin art (like the bag and the hazards) so a gift always
    // reads as a gift whatever skin is equipped, and like the bag it leaves no
    // track behind when tapped. Drawn upright (no spin).
    if (box.isGift) {
        if (box.isBoom) return null;
        return wrap(giftArt, "tapGift");
    }

    // 💰 Bonus money bag (what used to be the "golden" box). It replaces the
    // card art entirely — the old glow-around-the-card treatment is gone — but
    // the tap behaviour is unchanged: same handler, same bonus points.
    //
    // Tapped: the bag is simply gone — no leftover track/hole marker behind
    // it, unlike the cards.
    if (box.isGolden) {
        if (box.isBoom) return null;
        return wrap(bagArt, "tapMoneyBag");
    }

    // 🖌️ Admin-authored SVG (backend icon_svg) — wins over the on-device art so
    // the falling card matches what the Shop shows for the equipped skin. The
    // render size honours the admin-set width/height (Play only); otherwise it
    // falls back to the on-device size. The transform is recentred on those
    // dimensions so a non-square card still pivots/positions correctly.
    if (typeof box.iconSvg === "string" && box.iconSvg.trim()) {
        return box.isBoom ? (
            <View style={trackStyle}>
                <TrackIcon width={svgW} height={svgH}
                    color={box.randomColors ? randomColor : (box.trackColor ?? box.color ?? DARK_NAVY)}/>
            </View>
        ) : wrap(svgArt, "tapCard");
    }

    // 🟦 Square — no artwork of its own: a coloured rounded box, whose size
    // buildBoxStyle above rolls once and keeps on the box.
    if (typeName === "square") {
        const size = squareSizeOf(box);

        return box.isBoom ? (
            <View style={trackStyle}>
                <TrackIcon width={size[0]} height={size[1]} color={box.color || "blue"}/>
            </View>
        ) : wrap(null, "tapCard");
    }

    // 🃏 Default (Card)
    return box.isBoom ? (
        <View style={trackStyle}>
            <TrackIcon width={100} height={100} color={DARK_NAVY}/>
        </View>
    ) : wrap(cardArt, "tapCard");
}

export default React.memo(PlayBox);
