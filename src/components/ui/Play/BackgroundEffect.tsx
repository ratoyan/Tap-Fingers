import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, LayoutChangeEvent, StyleSheet, View, ViewStyle} from 'react-native';
import {SH, SW} from '../../../utils/responsive';

// ── Background effect layer ───────────────────────────────────────────────────
// Weather and atmosphere over the equipped background: snow, embers, rain and
// so on. Which one a background carries is picked in the admin panel and stored
// on the catalog row (shop_items.bg_effect), so a background can be given
// weather — or have it taken away — with no app release.
//
// Everything here runs on the native driver. This sits underneath a live game,
// so the rule is that once the particles are laid out, JavaScript does no work
// per frame at all: each particle is one looping 0→1 value feeding `transform`
// and `opacity`, both of which the native animation module owns outright. The
// layout props (left/top/size/colour) are set once and never animated, which is
// exactly what lets the rest be native.
//
// The same component draws the shop preview, so what a card shows is what
// buying it gives you. Density follows the container's area rather than a
// separate "preview" mode — a shop card is a twentieth of the screen and gets a
// handful of flakes instead of a blizzard, from the same numbers.

export type BackgroundEffectKey =
    | 'snow'
    | 'embers'
    | 'rain'
    | 'stars'
    | 'fireflies'
    | 'petals'
    | 'wind'
    | 'bubbles'
    | 'lightning';

// The keys the admin panel offers. Anything else the catalog sends (an effect
// added server-side before this build shipped) renders as nothing rather than
// crashing — see BackgroundEffect below.
export const EFFECT_KEYS: BackgroundEffectKey[] = [
    'snow', 'embers', 'rain', 'stars', 'fireflies', 'petals', 'wind', 'bubbles', 'lightning',
];

// How an effect names itself outside the game: an emoji and a translation key.
// The shop card announces the weather in one corner badge instead of running
// the effect over the whole preview — at card size the particles read as specks
// of dust over the artwork rather than as snow, and twenty cards each looping a
// blizzard is a lot of work for something nobody plays on.
export interface EffectBadge {
    icon: string;
    labelKey: string;
}

const EFFECT_BADGES: Record<BackgroundEffectKey, EffectBadge> = {
    snow: {icon: '❄️', labelKey: 'effectSnow'},
    embers: {icon: '🔥', labelKey: 'effectEmbers'},
    rain: {icon: '🌧️', labelKey: 'effectRain'},
    stars: {icon: '✨', labelKey: 'effectStars'},
    fireflies: {icon: '🪰', labelKey: 'effectFireflies'},
    petals: {icon: '🌸', labelKey: 'effectPetals'},
    wind: {icon: '🌬️', labelKey: 'effectWind'},
    bubbles: {icon: '🫧', labelKey: 'effectBubbles'},
    lightning: {icon: '⚡', labelKey: 'effectLightning'},
};

/**
 * The badge for a catalog effect key, or null when there is no effect — or when
 * the key is one this build has never heard of, exactly as the renderer treats
 * it. A background given weather server-side after this build shipped shows no
 * badge rather than an empty one.
 */
export function effectBadge(effect?: string | null): EffectBadge | null {
    if (!effect) return null;
    return EFFECT_BADGES[effect as BackgroundEffectKey] ?? null;
}

// One particle's whole life. Everything is decided once, at layout, so the
// render path stays free of per-frame work.
interface Particle {
    // Static: position, size, colour. Never animated — animating these would
    // pull the whole effect off the native driver.
    style: ViewStyle;
    // Distance travelled over one cycle.
    travelX: number;
    travelY: number;
    // Horizontal wobble, peaking a quarter and three quarters of the way
    // through. This is what stops snow falling like a curtain of dots.
    sway: number;
    // Degrees turned over one cycle.
    spin: number;
    // Keyframes at 0 / 0.12 / 0.85 / 1 of the cycle. Fading in and out at the
    // ends is what hides the jump when the loop restarts.
    opacity: [number, number, number, number];
    duration: number;
    // One-time stagger. Applied by delaying the loop's *start* rather than by
    // putting a delay inside it — a delay inside would repeat every cycle and
    // turn a steady drift into a pulse.
    delay: number;
    easing: (value: number) => number;
}

interface EffectSpec {
    // Particle count at full screen. Scaled down for smaller containers.
    count: number;
    // `s` scales every dimension. It is above 1 on a small container: a 3px
    // flake is 3px whatever it falls through, so on a shop card the same
    // particle reads as dust unless it is drawn a little heavier.
    build: (rnd: () => number, w: number, h: number, s: number) => Particle;
}

/**
 * Deterministic 0–1 generator (LCG), so an effect looks the same every launch.
 *
 * The masks are the algorithm, not a micro-optimisation: they are what keep the
 * state inside 31 bits and the sequence reproducible.
 */
/* eslint-disable no-bitwise */
function rng(seed: number): () => number {
    let state = (seed & 0x7fffffff) || 1;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}
/* eslint-enable no-bitwise */

const linear = Easing.linear;
const breathe = Easing.inOut(Easing.quad);

/** A value between lo and hi. */
function span(rnd: () => number, lo: number, hi: number): number {
    return lo + rnd() * (hi - lo);
}

function pick<T>(rnd: () => number, options: T[]): T {
    return options[Math.floor(rnd() * options.length) % options.length];
}

const EFFECTS: Record<BackgroundEffectKey, EffectSpec> = {
    // Slow, soft, and swaying widely — snow that falls straight reads as static.
    snow: {
        count: 34,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 2, 6) * s;
            return {
                style: {left: rnd() * w, top: -size, width: size, height: size, borderRadius: size / 2, backgroundColor: '#ffffff'},
                travelX: 0,
                travelY: h + size * 2,
                sway: span(rnd, 10, 34),
                spin: 0,
                opacity: [0, 0.85, 0.75, 0],
                duration: span(rnd, 6000, 13000),
                delay: rnd() * 9000,
                easing: linear,
            };
        },
    },

    // Falling sparks. Small, bright and short-lived: an ember that crosses the
    // whole screen at a steady glow looks like confetti, not fire.
    embers: {
        count: 26,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 2, 4.5) * s;
            return {
                style: {
                    left: rnd() * w, top: -size, width: size, height: size, borderRadius: size / 2,
                    backgroundColor: pick(rnd, ['#ffd166', '#ffb347', '#ff7a1a']),
                },
                travelX: span(rnd, -20, 20),
                travelY: h + size * 2,
                sway: span(rnd, 12, 30),
                spin: 0,
                opacity: [0, 0.95, 0.35, 0],
                duration: span(rnd, 3800, 8000),
                delay: rnd() * 6000,
                easing: linear,
            };
        },
    },

    // Thin, fast and slanted. The slant comes from travelX rather than a rotate,
    // so the streak stays vertical while the whole column leans — which is what
    // rain against a window actually looks like.
    rain: {
        count: 40,
        build: (rnd, w, h, s) => {
            const length = span(rnd, 9, 20) * s;
            return {
                style: {left: rnd() * w, top: -length, width: 1.5 * s, height: length, borderRadius: 1, backgroundColor: 'rgba(198,224,255,0.6)'},
                travelX: span(rnd, 14, 30),
                travelY: h + length * 2,
                sway: 0,
                spin: 0,
                opacity: [0, 0.8, 0.8, 0],
                duration: span(rnd, 700, 1500),
                delay: rnd() * 1500,
                easing: linear,
            };
        },
    },

    // The one effect that doesn't travel: stars hold their place and breathe.
    // Each gets its own period so the sky never pulses in unison.
    stars: {
        count: 30,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 1.5, 3.5) * s;
            return {
                // Kept to the upper two thirds: stars low on the screen sit
                // where the ground of most artwork is.
                style: {left: rnd() * w, top: rnd() * h * 0.66, width: size, height: size, borderRadius: size / 2, backgroundColor: '#ffffff'},
                travelX: 0,
                travelY: 0,
                sway: 0,
                spin: 0,
                opacity: [0.15, 1, 0.35, 0.15],
                duration: span(rnd, 1400, 3800),
                delay: rnd() * 3000,
                easing: breathe,
            };
        },
    },

    // Few, slow and wandering — the count is deliberately low. A swarm reads as
    // an infestation rather than as a summer evening.
    fireflies: {
        count: 16,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 3, 5.5) * s;
            return {
                style: {
                    left: rnd() * w, top: span(rnd, h * 0.3, h * 0.95), width: size, height: size, borderRadius: size / 2,
                    backgroundColor: pick(rnd, ['#e8ff9e', '#ffe680', '#c8ff9e']),
                },
                travelX: span(rnd, -70, 70),
                travelY: span(rnd, -60, 30),
                sway: span(rnd, 14, 34),
                spin: 0,
                opacity: [0, 0.95, 0.4, 0],
                duration: span(rnd, 4000, 9000),
                delay: rnd() * 7000,
                easing: breathe,
            };
        },
    },

    // Wide sway and a full turn or more on the way down: a petal that falls
    // without turning is a pink dot.
    petals: {
        count: 18,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 5, 9) * s;
            return {
                style: {
                    left: rnd() * w, top: -size, width: size * 1.5, height: size, borderTopLeftRadius: size, borderBottomRightRadius: size,
                    backgroundColor: pick(rnd, ['#ff9ec4', '#ffd0e4', '#ffb3d1']),
                },
                travelX: span(rnd, -30, 30),
                travelY: h + size * 2,
                sway: span(rnd, 30, 70),
                spin: span(rnd, 200, 560) * (rnd() > 0.5 ? 1 : -1),
                opacity: [0, 0.9, 0.8, 0],
                duration: span(rnd, 7000, 14000),
                delay: rnd() * 10000,
                easing: linear,
            };
        },
    },

    // Long, faint horizontal streaks. Barely visible on purpose — wind you can
    // clearly see is dust, and it competes with the artwork underneath.
    wind: {
        count: 10,
        build: (rnd, w, h, s) => {
            // Length follows the container rather than the size scale: a streak
            // is read as "a gust across the frame", so it has to stay a fraction
            // of the frame's width whatever that frame is.
            const length = span(rnd, w * 0.18, w * 0.42);
            return {
                style: {left: -length, top: rnd() * h, width: length, height: span(rnd, 1.5, 3) * s, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)'},
                travelX: w + length * 2,
                travelY: span(rnd, -25, 25),
                sway: 0,
                spin: 0,
                opacity: [0, 0.55, 0.55, 0],
                duration: span(rnd, 3200, 7000),
                delay: rnd() * 6000,
                easing: linear,
            };
        },
    },

    // The only effect that travels upward. Hollow rather than filled, which is
    // the whole difference between a bubble and a ball.
    bubbles: {
        count: 20,
        build: (rnd, w, h, s) => {
            const size = span(rnd, 5, 15) * s;
            return {
                style: {
                    left: rnd() * w, top: h, width: size, height: size, borderRadius: size / 2,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.07)',
                },
                travelX: 0,
                travelY: -(h + size * 2),
                sway: span(rnd, 12, 38),
                spin: 0,
                opacity: [0, 0.75, 0.6, 0],
                duration: span(rnd, 5000, 11000),
                delay: rnd() * 8000,
                easing: linear,
            };
        },
    },

    // Not a particle at all — one sheet over the whole frame. Handled separately
    // below; the entry exists so the key is a valid effect everywhere else.
    lightning: {
        count: 0,
        build: () => {
            throw new Error('lightning is drawn as a full-frame flash, not particles');
        },
    },
};

function ParticleView({particle}: {particle: Particle}) {
    const t = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(t, {
                toValue: 1,
                duration: particle.duration,
                easing: particle.easing,
                useNativeDriver: true,
            }),
        );
        // Staggered by delaying the start, not by a delay inside the loop —
        // see the note on Particle.delay.
        const timer = setTimeout(() => loop.start(), particle.delay);

        return () => {
            clearTimeout(timer);
            loop.stop();
        };
    }, [particle, t]);

    const transform: any[] = [];
    if (particle.travelX) {
        transform.push({translateX: t.interpolate({inputRange: [0, 1], outputRange: [0, particle.travelX]})});
    }
    if (particle.travelY) {
        transform.push({translateY: t.interpolate({inputRange: [0, 1], outputRange: [0, particle.travelY]})});
    }
    if (particle.sway) {
        // A second translateX on purpose: transforms compose in order, so the
        // wobble rides on top of the drift instead of replacing it.
        transform.push({
            translateX: t.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, particle.sway, 0, -particle.sway, 0],
            }),
        });
    }
    if (particle.spin) {
        transform.push({rotate: t.interpolate({inputRange: [0, 1], outputRange: ['0deg', `${particle.spin}deg`]})});
    }

    return (
        <Animated.View
            style={[
                styles.particle,
                particle.style,
                {
                    opacity: t.interpolate({inputRange: [0, 0.12, 0.85, 1], outputRange: particle.opacity}),
                    transform,
                },
            ]}
        />
    );
}

// Two quick flashes and then a long wait, rather than an even blink: lightning
// that arrives on a metronome stops reading as weather within about ten seconds.
const LIGHTNING_CYCLE_MS = 9000;

function LightningView() {
    const t = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(t, {
                toValue: 1,
                duration: LIGHTNING_CYCLE_MS,
                easing: linear,
                useNativeDriver: true,
            }),
        );
        loop.start();
        return () => loop.stop();
    }, [t]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFill,
                styles.flash,
                {
                    opacity: t.interpolate({
                        inputRange: [0, 0.02, 0.04, 0.06, 0.09, 0.14, 1],
                        outputRange: [0, 0.5, 0.08, 0.55, 0.05, 0, 0],
                    }),
                },
            ]}
        />
    );
}

interface BackgroundEffectProps {
    // Null/undefined, or a key this build doesn't know, renders nothing.
    effect?: string | null;
}

const SCREEN_AREA = SW * SH;

function BackgroundEffect({effect}: BackgroundEffectProps) {
    // Measured rather than assumed: the same component fills the Play screen and
    // a shop card, and particles positioned against the screen would fall
    // entirely outside the card.
    const [box, setBox] = useState<{w: number; h: number} | null>(null);

    const spec = effect && EFFECTS[effect as BackgroundEffectKey];

    const particles = useMemo(() => {
        if (!spec || !box || spec.count === 0) {
            return [];
        }
        // Density follows the square root of the area rather than the area
        // itself: scaling linearly leaves a shop card with one or two lonely
        // flakes, which reads as a glitch rather than as light snow.
        const ratio = Math.sqrt((box.w * box.h) / SCREEN_AREA);
        const count = Math.max(3, Math.round(spec.count * Math.min(ratio, 1)));
        // Size scale: 1 at full screen, heavier on a smaller container — see
        // EffectSpec.build. Capped so a tiny box gets chunkier particles rather
        // than a screenful of blobs.
        const scale = Math.min(2.2, Math.max(1, 1 / Math.max(ratio, 0.3)));

        // Seeded off the effect's own count so each effect keeps its own layout
        // between mounts — a background shouldn't rearrange itself every time
        // the shop is scrolled past it.
        const rnd = rng(spec.count * 7919 + 13);
        return Array.from({length: count}, () => spec.build(rnd, box.w, box.h, scale));
    }, [spec, box]);

    if (!spec) {
        return null;
    }

    const onLayout = (e: LayoutChangeEvent) => {
        const {width, height} = e.nativeEvent.layout;
        if (width > 0 && height > 0 && (box?.w !== width || box?.h !== height)) {
            setBox({w: width, h: height});
        }
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
            {effect === 'lightning' ? (
                <LightningView/>
            ) : (
                particles.map((p, i) => <ParticleView key={i} particle={p}/>)
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
    },
    flash: {
        backgroundColor: '#dbe9ff',
    },
});

// Memoized on the effect key alone: nothing else can change it, and this must
// not re-render while a game is running.
export default React.memo(BackgroundEffect);
