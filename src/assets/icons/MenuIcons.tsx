import * as React from "react"
import Svg, {Path, Circle, Rect, Ellipse, G, Defs, LinearGradient, RadialGradient, Stop} from "react-native-svg"

// Artwork for the Home menu buttons. Each icon sits on the purple gradient of
// MenuButton, so they share one palette: a warm gold body with a white gloss
// highlight, which stays legible against that background.
//
// Gradient ids are namespaced per icon (`mi<Name><Part>`) because react-native-svg
// resolves them from one global table — two icons reusing "grad" would silently
// paint each other.

interface MenuIconProps {
    size?: number;
}

const GOLD_LIGHT = "#FFF3C4";
const GOLD = "#FFD54F";
const GOLD_DEEP = "#FF9F1C";
const GOLD_EDGE = "#E07A00";

function PlayMenuIcon({size = 30}: MenuIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Defs>
                <LinearGradient id="miPlayDisc" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="0.55" stopColor={GOLD}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
                <RadialGradient id="miPlayGloss" cx="32" cy="18" r="20" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>
            <Circle cx="32" cy="32" r="27" fill="#FFFFFF" opacity={0.18}/>
            <Circle cx="32" cy="32" r="23" fill="url(#miPlayDisc)" stroke={GOLD_EDGE} strokeWidth={2}/>
            <Ellipse cx="32" cy="21" rx="15" ry="9" fill="url(#miPlayGloss)"/>
            <Path
                d="M27 21.5l17 10.5-17 10.5V21.5z"
                fill="#5B2C8D"
                stroke="#3E1A66"
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
        </Svg>
    )
}

function SettingsMenuIcon({size = 30}: MenuIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Defs>
                <LinearGradient id="miGearBody" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="0.5" stopColor={GOLD}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
                <RadialGradient id="miGearGloss" cx="26" cy="20" r="18" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>
            <Circle cx="32" cy="32" r="27" fill="#FFFFFF" opacity={0.15}/>
            {/* Eight teeth: four bars through the centre, each rotated 45°. Kept
                barely rounded (rx 1.5) and stubby — at rx 4 and full length they
                read as flower petals, not gear teeth. */}
            <G>
                {[0, 45, 90, 135].map(angle => (
                    <Rect
                        key={angle}
                        x="26.5"
                        y="9"
                        width="11"
                        height="46"
                        rx="1.5"
                        fill="url(#miGearBody)"
                        stroke={GOLD_EDGE}
                        strokeWidth={1.5}
                        transform={`rotate(${angle} 32 32)`}
                    />
                ))}
            </G>
            <Circle cx="32" cy="32" r="17" fill="url(#miGearBody)" stroke={GOLD_EDGE} strokeWidth={2}/>
            <Circle cx="27" cy="26" r="11" fill="url(#miGearGloss)"/>
            <Circle cx="32" cy="32" r="7.5" fill="#5B2C8D" stroke="#3E1A66" strokeWidth={1.5}/>
        </Svg>
    )
}

function ShopMenuIcon({size = 30}: MenuIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Defs>
                <LinearGradient id="miBagBody" x1="32" y1="20" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="0.5" stopColor={GOLD}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
                <LinearGradient id="miBagGloss" x1="16" y1="19" x2="30" y2="40" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </LinearGradient>
            </Defs>
            <Circle cx="32" cy="32" r="27" fill="#FFFFFF" opacity={0.15}/>
            {/* A cart, not a bag. Two passes at a handled bag both read as a
                padlock: an arc of any weight sitting on a rounded body IS a
                shackle at 30px, and thinning the arc only made it a thinner
                shackle. A cart's silhouette has no such collision. */}
            <Path
                d="M5 11h6.5a2.5 2.5 0 012.44 1.94L21 41.6a3 3 0 002.92 2.35H50"
                stroke={GOLD_LIGHT}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <Path
                d="M16.5 19h39l-4 17.6a2.5 2.5 0 01-2.44 1.94H21.2L16.5 19z"
                fill="url(#miBagBody)"
                stroke={GOLD_EDGE}
                strokeWidth={2}
                strokeLinejoin="round"
            />
            <Path d="M16.5 19h39l-1.4 6H17.9l-1.4-6z" fill="url(#miBagGloss)"/>
            {/* Basket grid — enough to read as a mesh, not so much it turns to
                mush at icon size. */}
            <Path
                d="M28.5 19.5l2.2 18.5M41 19.5l-1.2 18.5M18.6 28.5h34.4"
                stroke="#5B2C8D"
                strokeWidth={1.6}
                opacity={0.75}
            />
            <Circle cx="27" cy="52" r="4.6" fill={GOLD_LIGHT} stroke={GOLD_EDGE} strokeWidth={1.6}/>
            <Circle cx="46" cy="52" r="4.6" fill={GOLD_LIGHT} stroke={GOLD_EDGE} strokeWidth={1.6}/>
        </Svg>
    )
}

function TrophyMenuIcon({size = 30}: MenuIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Defs>
                <LinearGradient id="miCup" x1="32" y1="8" x2="32" y2="44" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="0.5" stopColor={GOLD}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
                <LinearGradient id="miBase" x1="32" y1="46" x2="32" y2="58" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD}/>
                    <Stop offset="1" stopColor={GOLD_EDGE}/>
                </LinearGradient>
                <RadialGradient id="miCupGloss" cx="25" cy="18" r="12" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>
            <Circle cx="32" cy="32" r="27" fill="#FFFFFF" opacity={0.15}/>
            {/* Side handles */}
            <Path
                d="M18 12H10v6a10 10 0 0010 10M46 12h8v6a10 10 0 01-10 10"
                stroke={GOLD}
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d="M17 9h30v13a15 15 0 01-30 0V9z"
                fill="url(#miCup)"
                stroke={GOLD_EDGE}
                strokeWidth={2}
                strokeLinejoin="round"
            />
            <Ellipse cx="25" cy="18" rx="6" ry="9" fill="url(#miCupGloss)"/>
            {/* Stem + base */}
            <Path d="M29 37h6v7h-6z" fill="url(#miBase)"/>
            <Path
                d="M20 51h24l2 5H18l2-5z"
                fill="url(#miBase)"
                stroke={GOLD_EDGE}
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
            <Rect x="24" y="44" width="16" height="7" rx="2" fill="url(#miBase)" stroke={GOLD_EDGE} strokeWidth={1.5}/>
            {/* Star on the cup face */}
            <Path
                d="M32 14l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L32 14z"
                fill="#5B2C8D"
            />
        </Svg>
    )
}

function TargetMenuIcon({size = 30}: MenuIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Defs>
                <LinearGradient id="miRing" x1="28" y1="4" x2="28" y2="56" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={GOLD_LIGHT}/>
                    <Stop offset="1" stopColor={GOLD_DEEP}/>
                </LinearGradient>
                <LinearGradient id="miDart" x1="38" y1="46" x2="60" y2="10" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF"/>
                    <Stop offset="1" stopColor="#FFE082"/>
                </LinearGradient>
                <RadialGradient id="miTargetGloss" cx="22" cy="20" r="16" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </RadialGradient>
            </Defs>
            <Circle cx="28" cy="32" r="26" fill="#FFFFFF" opacity={0.15}/>
            <Circle cx="28" cy="32" r="23" fill="url(#miRing)" stroke={GOLD_EDGE} strokeWidth={2}/>
            <Circle cx="28" cy="32" r="16" fill="#5B2C8D"/>
            <Circle cx="28" cy="32" r="9.5" fill="url(#miRing)"/>
            <Circle cx="28" cy="32" r="4" fill="#5B2C8D"/>
            <Circle cx="22" cy="22" r="10" fill="url(#miTargetGloss)"/>
            {/* Dart planted in the bullseye, flying in from the top-right */}
            <Path d="M28 32l24-24" stroke="#5B2C8D" strokeWidth={5} strokeLinecap="round"/>
            <Path d="M28 32l24-24" stroke="url(#miDart)" strokeWidth={2.5} strokeLinecap="round"/>
            <Path
                d="M45 5l14-1-1 14-6.5-6.5L45 5z"
                fill="url(#miDart)"
                stroke={GOLD_EDGE}
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
        </Svg>
    )
}

// Keyed by MenuType.icon so data/menu.ts stays a plain data list.
export const MENU_ICONS = {
    play: PlayMenuIcon,
    settings: SettingsMenuIcon,
    shop: ShopMenuIcon,
    progression: TrophyMenuIcon,
    challenges: TargetMenuIcon,
} as const;

export type MenuIconName = keyof typeof MENU_ICONS;

export {PlayMenuIcon, SettingsMenuIcon, ShopMenuIcon, TrophyMenuIcon, TargetMenuIcon};
