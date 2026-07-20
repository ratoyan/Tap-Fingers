import RNHapticFeedback, {HapticFeedbackTypes, pattern} from 'react-native-haptic-feedback';
import type {HapticEvent} from 'react-native-haptic-feedback';
import {storage} from '../db/kvStore.ts';
import {STORAGE_KEYS} from './storageKeys.ts';
import {isSfxMuted} from './sfx.ts';

// ── Haptics ─────────────────────────────────────────────────────────────────
// The counterpart to utils/sfx.ts: one module that owns every buzz in the game,
// keyed by what happened rather than by how it should feel. Call sites say
// haptic('bombHazard'), not Vibration.vibrate([0, 120, 60, 200]) — so the feel
// of an event can be retuned here without touching gameplay code.
//
// Why this replaced React Native's `Vibration`:
//
//  • Vibration.vibrate(ms) is a dumb motor on/off. On Android it ignores the
//    device's haptic hardware entirely, so a modern phone with a linear
//    resonant actuator produced the same cheap rattle as a 2015 handset.
//    react-native-haptic-feedback goes through VibrationEffect (Android) and
//    the Taptic Engine (iOS), which is what makes a tap feel like a click
//    instead of a shudder. `enableVibrateFallback` keeps the old buzz for
//    devices that genuinely have nothing better.
//
//  • Patterns had to be hand-timed as [wait, on, wait, on] arrays. The library
//    takes a notation string — pattern('oO.O') — where o/O are soft/strong
//    transients and ./-/= are gaps, and spaces events at the ~100ms floor the
//    hardware can actually resolve.
//
//  • Intensity didn't exist. impact(type, 0..1) scales amplitude, so a boss hit
//    and a barrel explosion differ in force and not just duration.
//
// ── The silent-play case ────────────────────────────────────────────────────
// If the player has muted SFX, haptics stop being a garnish on the sound and
// become the *only* feedback channel. So every event has two renderings:
//
//   plain — sound is on. A single transient that punctuates the audio.
//   rich  — sound is muted. Multi-pulse patterns with more texture, because
//           there's no coin jingle to carry the "you got something" meaning.
//
// The high-frequency events (tap, hit, equip, countdown) stay single transients
// in BOTH modes on purpose — see the note on RAPID below.

export type HapticName =
    | 'tap'
    | 'hit'
    | 'coin'
    | 'heart'
    | 'shield'
    | 'slow'
    | 'bombHelper'
    | 'bombHazard'
    | 'barrel'
    | 'loseHeart'
    | 'countdown'
    | 'go'
    | 'claim'
    | 'purchase'
    | 'equip'
    | 'denied';

// A single transient at a given force, or a pattern. `impact` scales amplitude;
// `trigger` uses the OS's own canned notification feels, which are better tuned
// than anything hand-rolled for success/error.
type Feel =
    | {kind: 'impact'; type: HapticFeedbackTypes; intensity: number}
    | {kind: 'trigger'; type: HapticFeedbackTypes}
    | {kind: 'pattern'; events: HapticEvent[]};

const impact = (type: HapticFeedbackTypes, intensity: number): Feel =>
    ({kind: 'impact', type, intensity});

const FEELS: Record<HapticName, {plain: Feel; rich: Feel}> = {
    // Fires hundreds of times a round. Selection is the lightest thing the OS
    // offers and is what list pickers use — anything heavier turns a good round
    // into a numb thumb.
    tap: {
        plain: impact(HapticFeedbackTypes.selection, 0.35),
        rich: impact(HapticFeedbackTypes.impactLight, 0.55),
    },
    // Chipping at the boss. `rigid` is sharper than impactLight at the same
    // force, which is what sells "hit something solid" over "touched a button".
    hit: {
        plain: impact(HapticFeedbackTypes.impactLight, 0.45),
        rich: impact(HapticFeedbackTypes.rigid, 0.65),
    },
    coin: {
        plain: impact(HapticFeedbackTypes.impactLight, 0.5),
        rich: {kind: 'pattern', events: pattern('oO')},
    },
    heart: {
        plain: impact(HapticFeedbackTypes.impactMedium, 0.6),
        rich: {kind: 'pattern', events: pattern('oO.O')},
    },
    // Rising (soft → strong) for the protective helper, falling for the one that
    // winds the game down. Same direction as their sounds sweep.
    shield: {
        plain: impact(HapticFeedbackTypes.impactMedium, 0.7),
        rich: {kind: 'pattern', events: pattern('o.O')},
    },
    slow: {
        plain: impact(HapticFeedbackTypes.soft, 0.6),
        rich: {kind: 'pattern', events: pattern('O.o')},
    },
    bombHelper: {
        plain: impact(HapticFeedbackTypes.impactHeavy, 0.8),
        rich: {kind: 'pattern', events: pattern('OO')},
    },
    // The hazard hits harder than the helper — the player didn't ask for it.
    bombHazard: {
        plain: impact(HapticFeedbackTypes.impactHeavy, 0.9),
        rich: {kind: 'pattern', events: pattern('O.OO')},
    },
    barrel: {
        plain: impact(HapticFeedbackTypes.impactHeavy, 1.0),
        rich: {kind: 'pattern', events: pattern('OO.OO')},
    },
    // The only genuinely bad news in a round; the heaviest feel in the game.
    loseHeart: {
        plain: {kind: 'trigger', type: HapticFeedbackTypes.notificationError},
        rich: {kind: 'pattern', events: pattern('OO-OO')},
    },
    countdown: {
        plain: impact(HapticFeedbackTypes.selection, 0.4),
        rich: impact(HapticFeedbackTypes.impactLight, 0.6),
    },
    go: {
        plain: impact(HapticFeedbackTypes.impactHeavy, 0.8),
        rich: {kind: 'pattern', events: pattern('oO.O')},
    },
    // Menu events. claim is the biggest positive in the app and the only one
    // that gets a long pattern even when the sound is on — it's a once-in-a-
    // while payoff, not something the player triggers by the dozen.
    claim: {
        plain: {kind: 'pattern', events: pattern('oO.O')},
        rich: {kind: 'pattern', events: pattern('oO.O-O')},
    },
    purchase: {
        plain: impact(HapticFeedbackTypes.impactMedium, 0.7),
        rich: {kind: 'pattern', events: pattern('oO')},
    },
    equip: {
        plain: impact(HapticFeedbackTypes.selection, 0.3),
        rich: impact(HapticFeedbackTypes.impactLight, 0.5),
    },
    denied: {
        plain: {kind: 'trigger', type: HapticFeedbackTypes.notificationError},
        rich: {kind: 'pattern', events: pattern('OO')},
    },
};

// Events that can retrigger faster than the hardware can render a pulse. The
// motor needs ~80-100ms to produce a distinct transient; below that the pulses
// blur into a continuous hum that feels broken rather than fast. Dropping the
// in-between calls keeps every buzz that IS played crisp.
//
// This is also why these events never get a multi-pulse `rich` pattern: a
// pattern queued on every tap would still be playing when the next tap lands.
const RAPID: Partial<Record<HapticName, number>> = {
    tap: 45,
    hit: 45,
    equip: 45,
};

const lastAt = new Map<HapticName, number>();

// Old devices with no haptic actuator fall back to the plain motor rather than
// going silent. Android's system haptic setting is respected — if the player
// turned haptics off OS-wide, that decision outranks ours.
const OPTIONS = {enableVibrateFallback: true, ignoreAndroidSystemSettings: false};

/**
 * Reads the persisted vibration sentinel. Call before the first haptic().
 * STORAGE_KEYS.VIBRATION is inverted like SOUND/MUSIC: a stored value means off.
 */
export async function refreshHapticsEnabled(): Promise<void> {
    RNHapticFeedback.setEnabled(!(await storage.getItem(STORAGE_KEYS.VIBRATION)));
}

/** Lets the settings toggles flip the gate without a storage round-trip. */
export function setHapticsEnabled(value: boolean): void {
    RNHapticFeedback.setEnabled(value);
}

export function isHapticsEnabled(): boolean {
    return RNHapticFeedback.isEnabled();
}

/**
 * Plays the feel for an event. Safe to call unconditionally — the enabled gate,
 * the rapid-fire throttle and the sound-muted branch are all handled here, so
 * call sites stay a single line with no `if` in front of them.
 */
export function haptic(name: HapticName): void {
    if (!RNHapticFeedback.isEnabled()) return;

    const minGap = RAPID[name];
    if (minGap !== undefined) {
        const now = Date.now();
        if (now - (lastAt.get(name) ?? 0) < minGap) return;
        lastAt.set(name, now);
    }

    // Muted SFX promotes haptics from garnish to the whole feedback channel.
    const feel = isSfxMuted() ? FEELS[name].rich : FEELS[name].plain;

    switch (feel.kind) {
        case 'impact':
            RNHapticFeedback.impact(feel.type, feel.intensity, OPTIONS);
            break;
        case 'trigger':
            RNHapticFeedback.trigger(feel.type, OPTIONS);
            break;
        case 'pattern':
            RNHapticFeedback.triggerPattern(feel.events, OPTIONS);
            break;
    }
}
