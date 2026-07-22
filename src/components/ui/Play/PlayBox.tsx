import React, {useMemo} from "react";
import {Pressable, Text, View, ViewStyle} from "react-native";
import {SvgXml} from "react-native-svg";
import {BoxType} from "../../../types/play.type.ts";
import {ShopType} from "../../../types/shop.type.ts";
import {BOMB_ORANGE, DARK_NAVY, HOT_PINK} from "../../../constants/colors.ts";

// icons
import Card1 from "../../../assets/icons/Card1";
import Ballon from "../../../assets/icons/Ballon";
import TrackIcon from "../../../assets/icons/TrackIcon";
import StarCard from "../../../assets/icons/StarCard";
import DiamondCard from "../../../assets/icons/DiamondCard";
import HeartCard from "../../../assets/icons/HeartCard";
import BombCard from "../../../assets/icons/BombCard";
import Ghost from "../../../assets/icons/Ghost";
import FlameIcon from "../../../assets/icons/FlameIcon";
import BoltIcon from "../../../assets/icons/BoltIcon";
import {FallingBomb, BombBlast} from "../../../assets/icons/FallingBomb";
import {MineBarrel, BarrelBlast, BARREL_ART_SCALE} from "../../../assets/icons/MineBarrel";
import {MoneyBag} from "../../../assets/icons/MoneyBag";
import {HeartPlus} from "../../../assets/icons/HeartPlus";

interface PlayBoxProps {
    box: any;
    handlePress: (box: any) => void;
}

// Vibrant hues used when a card is flagged "random colors" in admin.
const RANDOM_COLORS = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE',
    '#40C4FF', '#18FFFF', '#69F0AE', '#00E676', '#FFD740', '#FFAB40', '#FF6E40',
];

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
    return xml
        .replace(/(fill|stroke)\s*=\s*"(?!none|transparent)[^"]*"/gi, `$1="${color}"`)
        .replace(/(fill|stroke)\s*=\s*'(?!none|transparent)[^']*'/gi, `$1='${color}'`)
        .replace(/(fill|stroke)\s*:\s*(?!none|transparent)[^;"']+/gi, `$1:${color}`);
}

function PlayBox({box, handlePress}: PlayBoxProps) {

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
    // Square cards lock in a random size once. Hoisted to the top (not computed
    // inside the `square` branch) so this hook always runs — a box that gains an
    // admin SVG mid-flight switches branches, and a conditional hook there would
    // change the hook count between renders ("rendered fewer hooks").
    const squareSize = useMemo<[number, number]>(() => {
        const random = Math.floor(Math.random() * 50) + 101;
        return [random, random];
    }, []);

    // The artwork is the expensive part of a falling box — an admin SVG is dozens
    // of nodes, and Card1/MoneyBag/… are SVGs too. None of it changes while a box
    // falls; only its position does. But the game loop hands every box a fresh
    // object each frame, so React.memo on this component can't help and the whole
    // art tree would re-render 60×/sec, per box.
    //
    // Memoising the *elements* fixes that on its own: React bails out of a
    // subtree when the element is referentially identical, so the per-frame
    // re-render only rebuilds the wrapper's style and leaves the art untouched.
    // That's what makes a screen full of SVG cards affordable.
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

    const svgArt = useMemo(
        () => (
            <SvgXml xml={tintedSvg} width={svgW} height={svgH}
                color={box.randomColors ? randomColor : undefined}
                preserveAspectRatio={hasAdminDims ? "none" : "xMidYMid meet"}/>
        ),
        [tintedSvg, svgW, svgH, box.randomColors, randomColor, hasAdminDims],
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
    const baseTransform: ViewStyle["transform"] = [
        {translateX: box.x + box.size / 2},
        {translateY: box.y + box.size / 2},
        ...((box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
        {translateX: -box.size / 2},
        {translateY: -box.size / 2},
    ];

    const commonStyle: ViewStyle = {
        position: "absolute",
        transform: baseTransform,
    };

    // 🛢️ Mine barrel — the second hazard. Checked before isBomb so the two flags
    // can never both win a render, and before the card art for the same reason
    // the bomb is: a trap must always look like a trap, whatever skin is equipped.
    // Like the bomb it drops upright — the mine trigger belongs on top.
    if (box.isBarrel) {
        // Rocks around its own centre as it falls (the game loop writes the
        // angle into box.rotation) — a heavy drum tipping, not a spinning card.
        const barrelTransform: ViewStyle["transform"] = [
            {translateX: box.x + barrelSize / 2},
            {translateY: box.y + barrelSize / 2},
            {rotate: `${box.rotation || 0}deg`},
            {translateX: -barrelSize / 2},
            {translateY: -barrelSize / 2},
        ];
        const barrelStyle: ViewStyle = {position: "absolute", transform: barrelTransform};

        return box.isBoom ? (
            <View style={barrelStyle}>
                <BarrelBlast size={barrelSize}/>
            </View>
        ) : (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[barrelStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Mine barrel — do not tap"
            >
                {barrelArt}
            </Pressable>
        );
    }

    // 💣 Hazard bomb — wins over every card art (admin SVG included) so the
    // trap always reads as a bomb, whatever skin the player has equipped. It is
    // never golden; its own red halo does the highlighting.
    if (box.isBomb) {
        const bombSize = artSize;
        // No spin, no tilt: the bomb drops upright, so the lit fuse stays on top.
        const bombTransform: ViewStyle["transform"] = [
            {translateX: box.x},
            {translateY: box.y},
        ];
        const bombStyle: ViewStyle = {position: "absolute", transform: bombTransform};

        return box.isBoom ? (
            <View style={bombStyle}>
                <BombBlast size={bombSize}/>
            </View>
        ) : (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[bombStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Bomb — do not tap"
            >
                {bombArt}
            </Pressable>
        );
    }

    // ❤️ Life pickup — falls only when the player has a heart to win back.
    // Like the bag, it leaves no track behind when tapped.
    if (box.isHeart) {
        const heartStyle: ViewStyle = {
            position: "absolute",
            transform: [{translateX: box.x}, {translateY: box.y}],
        };

        if (box.isBoom) return null;

        return (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[heartStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Tap to regain a life"
            >
                {heartArt}
            </Pressable>
        );
    }

    // ❄️ Freeze pickup — rendered by its own cyan snowflake art and, like the
    // bag, it leaves no track behind when tapped. Drawn upright (no spin).
    if (box.isFreeze) {
        const freezeStyle: ViewStyle = {
            position: "absolute",
            transform: [{translateX: box.x}, {translateY: box.y}],
        };

        if (box.isBoom) return null;

        return (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[freezeStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Tap snowflake for slow motion"
            >
                {freezeArt}
            </Pressable>
        );
    }

    // 💰 Bonus money bag (what used to be the "golden" box). It replaces the
    // card art entirely — the old glow-around-the-card treatment is gone — but
    // the tap behaviour is unchanged: same handler, same bonus points.
    if (box.isGolden) {
        const bagSize = artSize;
        const bagStyle: ViewStyle = {
            position: "absolute",
            transform: [
                {translateX: box.x + bagSize / 2},
                {translateY: box.y + bagSize / 2},
                ...((box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
                {translateX: -bagSize / 2},
                {translateY: -bagSize / 2},
            ],
        };

        // Tapped: the bag is simply gone — no leftover track/hole marker behind
        // it, unlike the cards.
        if (box.isBoom) return null;

        return (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[bagStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Tap money bag"
            >
                {bagArt}
            </Pressable>
        );
    }

    // 🖌️ Admin-authored SVG (backend icon_svg) — wins over the on-device art so
    // the falling card matches what the Shop shows for the equipped skin. The
    // render size honours the admin-set width/height (Play only); otherwise it
    // falls back to the on-device size. The transform is recentred on those
    // dimensions so a non-square card still pivots/positions correctly.
    if (typeof box.iconSvg === "string" && box.iconSvg.trim()) {
        const svgTransform: ViewStyle["transform"] = [
            {translateX: box.x + svgW / 2},
            {translateY: box.y + svgH / 2},
            ...((box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
            {translateX: -svgW / 2},
            {translateY: -svgH / 2},
        ];
        const svgStyle: ViewStyle = {position: "absolute", transform: svgTransform};
        return box.isBoom ? (
            <View style={svgStyle}>
                <TrackIcon width={svgW} height={svgH}
                    color={box.randomColors ? randomColor : (box.trackColor ?? box.color ?? DARK_NAVY)}/>
            </View>
        ) : (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[svgStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Tap card"
            >
                {svgArt}
            </Pressable>
        );
    }

    // 🟦 Square
    if (typeName === "square") {
        const size = squareSize;

        return box.isBoom ? (
                <View style={commonStyle}>
                    <TrackIcon width={size[0]} height={size[1]} color={box.color || "blue"}/>
                </View>
            )
            :
            (
                <Pressable
                    onPressIn={() => handlePress(box)}
                    accessibilityRole="button"
                    accessibilityLabel="Tap card"
                    style={[
                        commonStyle,
                        {
                            width: size[0],
                            height: size[1],
                            backgroundColor: box.color || "blue",
                            zIndex: 1,
                            borderRadius: 10
                        },
                    ]}
                />
            )
    }


    // 🃏 Default (Card)
    return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={DARK_NAVY}/>
            </View>
        )
        :
        (
            <Pressable
                onPressIn={() => handlePress(box)}
                style={[commonStyle, {zIndex: 1}]}
                accessibilityRole="button"
                accessibilityLabel="Tap card"
            >
                {cardArt}
            </Pressable>
        )
}

export default React.memo(PlayBox);