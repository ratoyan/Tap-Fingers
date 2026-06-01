import React, {useMemo} from "react";
import {Pressable, View, ViewStyle} from "react-native";
import {SvgXml} from "react-native-svg";
import {BoxType} from "../../../types/play.type.ts";
import {ShopType} from "../../../types/shop.type.ts";
import {BOMB_ORANGE, CYAN, DARK_NAVY, HOT_PINK} from "../../../constants/colors.ts";

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

interface PlayBoxProps {
    box: any;
    handlePress: () => void;
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
    const goldenGlow: ViewStyle = box.isGolden ? {
        borderWidth: 2,
        borderColor: '#FFD700',
        borderRadius: 25,
        shadowColor: '#FFD700',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 1,
        shadowRadius: 22,
        elevation: 44,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
    } : {};

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
        ...goldenGlow,
    };

    // 🖌️ Admin-authored SVG (backend icon_svg) — wins over the on-device art so
    // the falling card matches what the Shop shows for the equipped skin. The
    // render size honours the admin-set width/height (Play only); otherwise it
    // falls back to the on-device size. The transform is recentred on those
    // dimensions so a non-square card still pivots/positions correctly.
    if (typeof box.iconSvg === "string" && box.iconSvg.trim()) {
        // Admin-set width/height fill the box exactly (stretch); without them,
        // keep the artwork's own aspect ratio.
        const hasAdminDims = !!(box.width || box.height);
        const svgW = box.width || box.size || 100;
        const svgH = box.height || box.size || 100;
        const svgTransform: ViewStyle["transform"] = [
            {translateX: box.x + svgW / 2},
            {translateY: box.y + svgH / 2},
            ...((box?.isRotation && box?.rotation) ? [{rotate: `${box.rotation}deg`}] : []),
            {translateX: -svgW / 2},
            {translateY: -svgH / 2},
        ];
        const svgStyle: ViewStyle = {position: "absolute", transform: svgTransform, ...goldenGlow};
        return box.isBoom ? (
            <View style={svgStyle}>
                <TrackIcon width={svgW} height={svgH}
                    color={box.randomColors ? randomColor : (box.trackColor ?? box.color ?? DARK_NAVY)}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[svgStyle, {zIndex: 1}]}>
                <SvgXml xml={tintedSvg} width={svgW} height={svgH}
                    color={box.randomColors ? randomColor : undefined}
                    preserveAspectRatio={hasAdminDims ? "none" : "xMidYMid meet"}/>
            </Pressable>
        );
    }

    // 🎈 Ballon
    if (typeName === "ballon") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={130} height={130} color={box.color}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Ballon color={box.color}/>
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
                    onPress={handlePress}
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

    // ⭐ Star
    if (typeName === "star") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="#FFD700"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <StarCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 💎 Diamond
    if (typeName === "diamond") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={CYAN}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <DiamondCard width={100} height={100}/>
            </Pressable>
        );
    }

    // ❤️ Heart
    if (typeName === "heart") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={HOT_PINK}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <HeartCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 💣 Bomb
    if (typeName === "bomb") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={BOMB_ORANGE}/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <BombCard width={100} height={100}/>
            </Pressable>
        );
    }

    // 👻 Ghost
    if (typeName === "ghost") {
        return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color="rgba(255,255,255,0.6)"/>
            </View>
        ) : (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Ghost size={100} color={box.color ?? '#fff'} eyeColor="#4B0082"/>
            </Pressable>
        );
    }

    // 🃏 Default (Card)
    return box.isBoom ? (
            <View style={commonStyle}>
                <TrackIcon width={100} height={100} color={DARK_NAVY}/>
            </View>
        )
        :
        (
            <Pressable onPress={handlePress} style={[commonStyle, {zIndex: 1}]}>
                <Card1 width={100} height={100}/>
            </Pressable>
        )
}

export default PlayBox;