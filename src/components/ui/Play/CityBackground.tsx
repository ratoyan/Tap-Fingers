import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop} from 'react-native-svg';
import {CitySkyline} from '../../../services/types';

type Tower = CitySkyline['towers'][number];

// ── City background ───────────────────────────────────────────────────────────
// One static SVG scene: sun up top, city skyline along the bottom. It is both
// the Play-screen background and the preview for every background in the shop —
// the whole "Backgrounds" section is cities now, and a background is nothing but
// a palette for this scene. Every colour comes from the backend catalog
// (shop_items.bg_colors); the shapes are the only thing that lives on-device.
//
// Everything here is deliberately static — no animation, no Math.random. It sits
// underneath a running game, so it must cost one render and then nothing, and
// the skyline has to look identical on every launch rather than reshuffling its
// lit windows each time the screen mounts.

// The scene is authored in a 400×800 box; `height` re-proportions it for shorter
// containers (the shop preview) by scaling every y. x is never scaled, so the
// towers keep their width and the picture only ever gets shorter, not narrower.
const VB_W = 400;
const AUTHORED_H = 800;

// Fallback silhouette, for a catalog that hasn't sent one (an app build ahead of
// the server, or a first launch with no cache). Every city normally arrives with
// its own — a shape, not just a palette, is what makes two cities different
// places rather than the same place repainted.
//
// Front row: the dark silhouette. Towers are contiguous (each x is the previous
// x + w) and span the full width, so the skyline path can be walked straight
// off this list.
const TOWERS: Tower[] = [
    {x: 0, w: 56, top: 660},
    {x: 56, w: 54, top: 596},
    {x: 110, w: 42, top: 700},
    {x: 152, w: 62, top: 566},
    {x: 214, w: 48, top: 648},
    {x: 262, w: 58, top: 604},
    {x: 320, w: 40, top: 690},
    {x: 360, w: 40, top: 626},
];

// Back row, hazy and offset from the front one so the two read as depth rather
// than a single wall. Authored as {x, top} corners so it can be scaled too.
const FAR_ROW: {x: number; top: number}[] = [
    {x: 46, top: 622},
    {x: 92, top: 560},
    {x: 140, top: 602},
    {x: 188, top: 500},
    {x: 232, top: 572},
    {x: 286, top: 518},
    {x: 332, top: 590},
    {x: 400, top: 542},
];

// Last-resort palette. Only reached when the catalog hasn't given this
// background one (offline first launch, or a field an admin cleared) — normally
// every colour below comes from the server.
const DEFAULT_SKY = ['#050a24', '#141a4d', '#3b1f6e', '#8c3f6b', '#e0714a', '#f7b267'];
const DEFAULT_BUILDINGS = ['#150f2e', '#07040f'];
const DEFAULT_WINDOW = '#ffd98a';
const DEFAULT_SUN = ['#fff3c4', '#ffd166', '#ff9e3d'];
const DEFAULT_GLOW = '#ffb347';

// How much of the building ramp the back row keeps. Drawing the same colours
// faded is what reads as distance, and tying the two rows together means a
// recoloured city stays coherent front to back instead of needing a second
// ramp that an admin could set to something unrelated.
const FAR_ROW_OPACITY = 0.55;

const WINDOW_W = 6;
const WINDOW_H = 9;
const WINDOW_STEP_X = 14;
const WINDOW_STEP_Y = 18;

// Opacity of a window whose light is still off. Not zero: a dark pane still
// reads as a window, so the skyline keeps its texture and lighting up looks like
// a light coming on rather than a rectangle appearing out of nowhere.
const WINDOW_DARK_OPACITY = 0.09;

// Where the sun rests, as a percentage of the frame, when the catalog hasn't
// placed it. Matches the position every city used before it became per-city.
const DEFAULT_SUN_X_PCT = 71.5;
const DEFAULT_SUN_Y_PCT = 51.9;

// How far above its resting place the sun starts, in authored y. The run's
// evening closes this gap (see `lit`), which is what makes a good run look like
// the hours passing rather than like a brightness slider.
const SUN_RISE = 183;
const SUN_R = 54;
const SUN_GLOW_R = 170;

interface Win {
    key: string;
    x: number;
    y: number;
    bright: boolean;
    // 0–1. The window lights up once `lit` passes this, so the city fills in
    // scattered across the whole skyline instead of sweeping left to right.
    wakesAt: number;
}

// How much darker/lighter a tower is drawn than its neighbours. The front row
// used to be one filled path, so wherever two towers of similar height met they
// merged into a single blob and the city read as a wall with notches. Giving
// each its own opacity over the sky separates them — the further-back ones let
// a little sky through, which is exactly how a real skyline reads.
const TOWER_SHADE = [1, 0.9, 0.96, 0.86, 0.99, 0.92];

// The band of light down the edge facing the sun. Thin and faint on purpose: it
// only has to suggest that towers have two sides.
const TOWER_EDGE_W = 3.5;
const TOWER_EDGE_OPACITY = 0.14;

// Roof masts, on the taller towers only. A skyline of flat tops is what makes a
// generated one look generated; a few verticals breaking the roofline is most of
// what separates it from a bar chart.
const MAST_MIN_HEIGHT = 170;
const MAST_W = 3;
const MAST_BEACON_R = 3.5;

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

interface TowerArt {
    key: string;
    x: number;
    w: number;
    top: number;
    h: number;
    shade: number;
    // x of the narrow lit strip, or null when the tower is too slim to carry one.
    edgeX: number | null;
    // Mast height above the roof, 0 for none.
    mast: number;
}

// Turns the catalog's bare towers into what actually gets drawn. Everything here
// is a pure function of the tower's own numbers, so a city looks the same on
// every launch and no state has to travel with the shape.
function towerArt(towers: Tower[], ground: number, sy: number, sunCx: number): TowerArt[] {
    return towers.map((t, i) => {
        const top = t.top * sy;
        // Measured in authored space, NOT against `ground`. `ground` is the
        // viewBox height, which the shop preview shortens to 430 — mixing it
        // with an unscaled `top` gave a negative height for every real tower
        // there, so the shop cards lost their masts and beacons while Play,
        // where the two happen to be equal, kept them.
        const height = AUTHORED_H - t.top;
        // Lit edge faces the sun. A tower directly under it gets none — light
        // from straight on wouldn't pick out either side.
        const centre = t.x + t.w / 2;
        const facesRight = sunCx > centre;
        const nearlyUnderSun = Math.abs(sunCx - centre) < t.w;

        return {
            key: `t${i}`,
            x: t.x,
            w: t.w,
            top,
            h: ground - top,
            shade: TOWER_SHADE[i % TOWER_SHADE.length],
            edgeX: t.w < TOWER_EDGE_W * 3 || nearlyUnderSun
                ? null
                : (facesRight ? t.x + t.w - TOWER_EDGE_W : t.x),
            mast: height >= MAST_MIN_HEIGHT && (i * 3 + 1) % 4 !== 0
                ? (24 + ((i * 37) % 22)) * sy
                : 0,
        };
    });
}

function farPath(row: {x: number; top: number}[], ground: number, sy: number): string {
    let d = `M0 ${ground}`;
    for (const p of row) d += ` V${p.top * sy} H${p.x}`;
    return `${d} V${ground} Z`;
}

// The grid is laid out in scaled space, so a tower keeps the same number of
// rows at any `height` — a preview shows the same city, not a cropped one.
function windowsFor(tower: Tower, index: number, ground: number, sy: number): Win[] {
    const top = tower.top * sy;
    const stepX = WINDOW_STEP_X;
    const stepY = WINDOW_STEP_Y * sy;
    const cols = Math.floor((tower.w - 8) / stepX);
    const rows = Math.floor((ground - top - 24 * sy) / stepY);
    if (cols < 1 || rows < 1) return [];

    // Centre the grid on the tower so narrow towers don't end up lopsided.
    const padX = (tower.w - ((cols - 1) * stepX + WINDOW_W)) / 2;

    const out: Win[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Deterministic stand-in for randomness: a cheap hash of the cell's
            // position leaves roughly a quarter of the windows dark, in a
            // pattern that doesn't read as a regular grid.
            if ((r * 7 + c * 3 + index * 5) % 4 === 0) continue;
            out.push({
                key: `${index}-${r}-${c}`,
                x: tower.x + padX + c * stepX,
                y: top + 16 * sy + r * stepY,
                bright: (r * 5 + c * 11 + index * 3) % 3 === 0,
                // A second, unrelated hash so wake-up order has nothing to do
                // with which windows are bright — otherwise the city would
                // light up in visible stripes.
                wakesAt: ((r * 29 + c * 17 + index * 53) % 100) / 100,
            });
        }
    }
    return out;
}

interface CityBackgroundProps {
    // Sky gradient stops, top → horizon. This is the background's identity: the
    // catalog palette is what makes one city different from another. Falls back
    // to the built-in ramp below two stops, which is what a gradient needs.
    colors?: string[];
    // Tower gradient stops, roof → street. Same catalog, same rule.
    buildingColors?: string[];
    // The lit windows.
    windowColor?: string;
    // The sun's disc, top → bottom.
    sunColors?: string[];
    // The light around the sun. It also tints the haze above the rooftops:
    // that's the same light reaching the horizon, and letting the two differ
    // only ever produced a city lit by two suns.
    glowColor?: string;
    // 0–1: how far into the city's evening this is. Play raises it as the player
    // climbs levels, so a good run visibly turns dusk into night — the windows
    // come on and the sun sinks toward the rooftops. Progress you feel rather
    // than read off a counter.
    //
    // Only these two move. The palette is what the player bought, so nothing
    // here recolours the sky: the same city at a later hour, not a different
    // one. Everywhere else (the shop, above all) the default shows the city
    // fully lit, which is what the shop is selling.
    lit?: number;
    // The city's own silhouette from the catalog. Falls back to the bundled one
    // above when the server hasn't sent a shape for this background.
    skyline?: CitySkyline | null;
    // Where the sun sits, as percentages of the frame. `sunY` is its *resting*
    // place — where it ends up at full evening, which is what the shop and the
    // admin preview show. Play starts it SUN_RISE higher and sinks it to here,
    // so the number an admin types is the position they are looking at.
    sunX?: number | null;
    sunY?: number | null;
    // viewBox height. The default suits a portrait phone; the shop preview
    // passes a smaller one so the sun and the skyline both fit in a short box
    // instead of `slice` cropping one of them away.
    height?: number;
    // Gradient ids are namespaced with this. The shop renders twenty of these
    // side by side and react-native-svg resolves ids across the whole document,
    // so a shared "citySky" would let whichever card mounted first paint all of
    // them (the same trap the per-card gradient ids in the catalog avoid).
    id?: string;
}

function CityBackground({
    colors,
    buildingColors,
    windowColor,
    sunColors,
    glowColor,
    lit = 1,
    skyline,
    sunX,
    sunY,
    height = AUTHORED_H,
    id = 'play',
}: CityBackgroundProps) {
    const sky = colors && colors.length >= 2 ? colors : DEFAULT_SKY;
    const towers = buildingColors && buildingColors.length >= 2 ? buildingColors : DEFAULT_BUILDINGS;
    const sun = sunColors && sunColors.length >= 2 ? sunColors : DEFAULT_SUN;
    const windowFill = windowColor || DEFAULT_WINDOW;
    const glow = glowColor || DEFAULT_GLOW;

    // The paths and window rects depend only on the geometry props, so they're
    // rebuilt only when those change — not on every render of the screen above.
    const scene = useMemo(() => {
        const sy = height / AUTHORED_H;
        // A shape is only usable if both rows are there — a half-sent skyline
        // would draw a city with no back row rather than fall back cleanly.
        const towers = skyline?.towers?.length ? skyline.towers : TOWERS;
        const far = skyline?.far?.length ? skyline.far : FAR_ROW;
        return {
            sy,
            towers,
            far: farPath(far, height, sy),
            windows: towers.flatMap((t, i) => windowsFor(t, i, height, sy)),
        };
    }, [height, skyline]);

    const evening = clamp01(lit);
    const sunCx = ((sunX ?? DEFAULT_SUN_X_PCT) / 100) * VB_W;
    // Rest position minus what's left of the climb down.
    const sunCy = (((sunY ?? DEFAULT_SUN_Y_PCT) / 100) * AUTHORED_H - SUN_RISE * (1 - evening)) * scene.sy;

    // Built here rather than inside the memo because the lit edge depends on
    // where the sun is, which moves through a run.
    const art = towerArt(scene.towers, height, scene.sy, sunCx);

    const skyId = `citySky-${id}`;
    const glowId = `cityGlow-${id}`;
    const sunId = `citySun-${id}`;
    const hazeId = `cityHaze-${id}`;
    const buildingId = `cityBld-${id}`;

    return (
        <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
            viewBox={`0 0 ${VB_W} ${height}`}
            preserveAspectRatio="xMidYMid slice"
            pointerEvents="none"
        >
            <Defs>
                <LinearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
                    {sky.map((c, i) => (
                        <Stop
                            key={`${c}-${i}`}
                            offset={`${sky.length === 1 ? 0 : (i / (sky.length - 1)) * 100}%`}
                            stopColor={c}
                        />
                    ))}
                </LinearGradient>
                <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={glow} stopOpacity={0.55} />
                    <Stop offset="45%" stopColor={glow} stopOpacity={0.22} />
                    <Stop offset="100%" stopColor={glow} stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id={sunId} x1="0" y1="0" x2="0" y2="1">
                    {sun.map((c, i) => (
                        <Stop
                            key={`${c}-${i}`}
                            offset={`${sun.length === 1 ? 0 : (i / (sun.length - 1)) * 100}%`}
                            stopColor={c}
                        />
                    ))}
                </LinearGradient>
                {/* Light pooling just above the rooftops, which is what sells the
                    two skyline rows as distance — the same glow colour, weaker,
                    because it is the same sun. */}
                <RadialGradient id={hazeId} cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={glow} stopOpacity={0.3} />
                    <Stop offset="100%" stopColor={glow} stopOpacity={0} />
                </RadialGradient>
                {/* One ramp for both rows — the back row is this same gradient
                    drawn faded (see FAR_ROW_OPACITY), so recolouring the towers
                    can't leave the two halves of the skyline disagreeing. */}
                <LinearGradient id={buildingId} x1="0" y1="0" x2="0" y2="1">
                    {towers.map((c, i) => (
                        <Stop
                            key={`${c}-${i}`}
                            offset={`${towers.length === 1 ? 0 : (i / (towers.length - 1)) * 100}%`}
                            stopColor={c}
                        />
                    ))}
                </LinearGradient>
            </Defs>

            {/* Sky. */}
            <Rect width={VB_W} height={height} fill={`url(#${skyId})`} />

            {/* Sun. Sinks toward the rooftops as the run's evening comes on. */}
            <Circle cx={sunCx} cy={sunCy} r={SUN_GLOW_R} fill={`url(#${glowId})`} />
            <Circle cx={sunCx} cy={sunCy} r={SUN_R} fill={`url(#${sunId})`} />

            {/* Horizon haze, behind both skylines. Follows the sun across: it is
                that sun's light on the rooftops, so a sun moved to the left edge
                has to take its glow with it. */}
            <Circle cx={sunCx} cy={580 * scene.sy} r={260} fill={`url(#${hazeId})`} />

            {/* Back row. */}
            <Path d={scene.far} fill={`url(#${buildingId})`} opacity={FAR_ROW_OPACITY} />

            {/* Front row, a tower at a time rather than one filled path, so each
                building can be shaded slightly differently and stop merging into
                its neighbours. */}
            {art.map(t => (
                <Rect
                    key={t.key}
                    x={t.x}
                    y={t.top}
                    width={t.w}
                    height={t.h}
                    fill={`url(#${buildingId})`}
                    opacity={t.shade}
                />
            ))}

            {/* Roof masts, with a light at the tip. */}
            {art.filter(t => t.mast > 0).map(t => (
                <Rect
                    key={`${t.key}m`}
                    x={t.x + t.w / 2 - MAST_W / 2}
                    y={t.top - t.mast}
                    width={MAST_W}
                    height={t.mast}
                    fill={`url(#${buildingId})`}
                />
            ))}

            {/* Every element below sets its own `fill`.

                They used to be wrapped in a group that carried the colour for
                them, which is how SVG inheritance works in a browser but is not
                something react-native-svg can be relied on for. They were the
                only elements in the scene depending on it — which is exactly why
                the window lights and the beacons were the only things that never
                appeared on a device while the towers, sky and sun all did. */}

            {/* The side of each tower the sun is on. */}
            {art.filter(t => t.edgeX !== null).map(t => (
                <Rect
                    key={`${t.key}e`}
                    x={t.edgeX!}
                    y={t.top}
                    width={TOWER_EDGE_W}
                    height={t.h}
                    fill={glow}
                    opacity={TOWER_EDGE_OPACITY}
                />
            ))}

            {/* Mast beacons, the same light as the windows — a city that is
                otherwise dark still has these on. */}
            {art.filter(t => t.mast > 0).map(t => (
                <Circle
                    key={`${t.key}b`}
                    cx={t.x + t.w / 2}
                    cy={t.top - t.mast}
                    r={MAST_BEACON_R}
                    fill={windowFill}
                    opacity={0.9}
                />
            ))}

            {/* Window lights. */}
            {scene.windows.map(w => (
                <Rect
                    key={w.key}
                    x={w.x}
                    y={w.y}
                    width={WINDOW_W}
                    height={WINDOW_H * scene.sy}
                    rx={1}
                    fill={windowFill}
                    opacity={
                        w.wakesAt < evening
                            ? (w.bright ? 0.85 : 0.45)
                            : WINDOW_DARK_OPACITY
                    }
                />
            ))}
        </Svg>
    );
}

export default React.memo(CityBackground);
