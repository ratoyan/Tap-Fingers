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
            {/* Eight teeth, drawn as one rounded cross rotated 45° twice */}
            <G>
                {[0, 45, 90, 135].map(angle => (
                    <Rect
                        key={angle}
                        x="27"
                        y="6"
                        width="10"
                        height="52"
                        rx="4"
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
                <LinearGradient id="miBagGloss" x1="16" y1="22" x2="30" y2="56" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55}/>
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/>
                </LinearGradient>
            </Defs>
            <Circle cx="32" cy="32" r="27" fill="#FFFFFF" opacity={0.15}/>
            {/* Handle sits behind the bag so it reads as coming over the rim */}
            <Path
                d="M22 24v-4a10 10 0 0120 0v4"
                stroke="#FFF8E1"
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
            />
            <Path
                d="M14 22h36l3 30a4 4 0 01-4 4.5H15a4 4 0 01-4-4.5l3-30z"
                fill="url(#miBagBody)"
                stroke={GOLD_EDGE}
                strokeWidth={2}
                strokeLinejoin="round"
            />
            <Path d="M14 22h36l1 10H13l1-10z" fill="url(#miBagGloss)"/>
            {/* Price tag mark */}
            <Path
                d="M32 33v14M27.5 36.5a4.5 4.5 0 014.5-3.5c2.5 0 4.5 1.6 4.5 3.5s-2 3.3-4.5 3.7-4.5 1.8-4.5 3.7 2 3.6 4.5 3.6a4.5 4.5 0 004.5-3.5"
                stroke="#5B2C8D"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
            />
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
