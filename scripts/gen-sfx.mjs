// Synthesises the game's sound effects into 16-bit mono WAVs.
//
// The SFX are generated rather than sourced so they stay consistent with each
// other (one palette, one loudness target) and can be re-tuned by editing a
// number here instead of hunting for a replacement file. Background music is
// NOT generated — those are real tracks and stay as they are.
//
//   node scripts/gen-sfx.mjs
//
// Writes every sound to android/app/src/main/res/raw/ and ios/TapFingers/,
// which is where react-native-sound's MAIN_BUNDLE looks. New iOS files must
// also be registered in TapFingers.xcodeproj/project.pbxproj or they won't be
// copied into the bundle.

import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIRS = [
    join(ROOT, 'android', 'app', 'src', 'main', 'res', 'raw'),
    join(ROOT, 'ios', 'TapFingers'),
];

// ── Synth primitives ────────────────────────────────────────────────────────

const buf = seconds => new Float32Array(Math.ceil(seconds * SR));
const val = (v, t) => (typeof v === 'function' ? v(t) : v);

function wave(kind, phase) {
    switch (kind) {
        case 'sine': return Math.sin(phase);
        case 'triangle': return (2 / Math.PI) * Math.asin(Math.sin(phase));
        case 'square': return Math.sin(phase) >= 0 ? 1 : -1;
        case 'saw': {
            const x = (phase / (2 * Math.PI)) % 1;
            return 2 * (x < 0 ? x + 1 : x) - 1;
        }
        default: throw new Error(`unknown wave: ${kind}`);
    }
}

// Phase is accumulated (not computed from t) so a swept frequency stays
// continuous — recomputing sin(2πft) per sample with a changing f would step
// the phase and buzz.
function tone(out, {kind = 'sine', freq, amp = 1, start = 0}) {
    let phase = 0;
    const i0 = Math.floor(start * SR);
    for (let i = i0; i < out.length; i++) {
        const t = (i - i0) / SR;
        phase += (2 * Math.PI * val(freq, t)) / SR;
        out[i] += val(amp, t) * wave(kind, phase);
    }
}

// Deterministic noise: a fixed seed keeps regenerated files byte-identical, so
// re-running the script doesn't churn the repo with "new" binaries.
function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000 * 2 - 1;
    };
}

function noise(out, {amp = 1, start = 0, seed = 12345}) {
    const rng = makeRng(seed);
    const i0 = Math.floor(start * SR);
    for (let i = i0; i < out.length; i++) {
        const t = (i - i0) / SR;
        out[i] += val(amp, t) * rng();
    }
}

// Percussive envelope: near-instant attack, exponential tail. `attack` keeps
// the very first sample from being a step edge (which clicks).
const perc = (attack, tau, peak = 1) => t => {
    if (t < 0) return 0;
    const a = t < attack ? t / attack : 1;
    return peak * a * Math.exp(-Math.max(0, t - attack) / tau);
};

// Exponential frequency sweep — pitch is perceived logarithmically, so a linear
// ramp sounds like it slows down at the top.
const sweep = (f0, f1, dur) => t => {
    const x = Math.min(1, Math.max(0, t / dur));
    return f0 * Math.pow(f1 / f0, x);
};

const gate = (from, to) => t => (t >= from && t < to ? 1 : 0);

function lowpass(out, cutoff) {
    const dt = 1 / SR;
    let y = 0;
    for (let i = 0; i < out.length; i++) {
        const fc = val(cutoff, i / SR);
        const rc = 1 / (2 * Math.PI * fc);
        const a = dt / (rc + dt);
        y += a * (out[i] - y);
        out[i] = y;
    }
}

function highpass(out, cutoff) {
    const dt = 1 / SR;
    const rc = 1 / (2 * Math.PI * cutoff);
    const a = rc / (rc + dt);
    let prevIn = out[0];
    let y = 0;
    for (let i = 0; i < out.length; i++) {
        const x = out[i];
        y = a * (y + x - prevIn);
        prevIn = x;
        out[i] = y;
    }
}

function shape(out, drive = 1) {
    for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * drive);
}

function mixInto(out, src, gain = 1) {
    for (let i = 0; i < Math.min(out.length, src.length); i++) out[i] += src[i] * gain;
}

// Normalise to a peak target and fade the edges. Every sound lands at the same
// loudness so no single effect jumps out of the mix, and the fades guarantee
// the buffer starts and ends at zero (a non-zero first/last sample pops).
function finish(out, peak = 0.85) {
    let max = 0;
    for (const s of out) max = Math.max(max, Math.abs(s));
    if (max > 0) {
        const g = peak / max;
        for (let i = 0; i < out.length; i++) out[i] *= g;
    }
    const fi = Math.floor(0.002 * SR);
    const fo = Math.floor(0.006 * SR);
    for (let i = 0; i < fi && i < out.length; i++) out[i] *= i / fi;
    for (let i = 0; i < fo && i < out.length; i++) out[out.length - 1 - i] *= i / fo;
    return out;
}

function writeWav(name, samples) {
    const n = samples.length;
    const data = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        data.writeInt16LE(Math.round(s * 32767), i * 2);
    }
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);        // PCM chunk size
    header.writeUInt16LE(1, 20);         // format = PCM
    header.writeUInt16LE(1, 22);         // mono
    header.writeUInt32LE(SR, 24);
    header.writeUInt32LE(SR * 2, 28);    // byte rate
    header.writeUInt16LE(2, 32);         // block align
    header.writeUInt16LE(16, 34);        // bits per sample
    header.write('data', 36);
    header.writeUInt32LE(data.length, 40);
    const wav = Buffer.concat([header, data]);

    for (const dir of OUT_DIRS) {
        mkdirSync(dir, {recursive: true});
        writeFileSync(join(dir, name), wav);
    }
    const ms = Math.round((n / SR) * 1000);
    console.log(`  ${name.padEnd(16)} ${String(ms).padStart(4)}ms  ${(wav.length / 1024).toFixed(0)}KB`);
}

// ── The sounds ──────────────────────────────────────────────────────────────
// House style: fast attack, short exponential tail, a pitch drop on impacts and
// a pitch rise on rewards. Sine/triangle bodies keep it clean; noise is only
// ever a transient, never the body (except the bomb).

// The one you hear hundreds of times a round — it has to be short and never
// grating. A falling body with a quieter octave on top and a click transient.
function tap() {
    const out = buf(0.12);
    tone(out, {kind: 'sine', freq: sweep(760, 500, 0.045), amp: perc(0.001, 0.030, 0.75)});
    tone(out, {kind: 'triangle', freq: sweep(1520, 1000, 0.045), amp: perc(0.001, 0.016, 0.22)});
    const click = buf(0.12);
    noise(click, {amp: perc(0.0005, 0.0025, 0.5), seed: 7});
    highpass(click, 4000);
    mixInto(out, click, 0.35);
    return finish(out);
}

// Money bag. The two-note rise (B5 → E6) is the arcade shorthand for "reward";
// the sub-octave sine underneath keeps it warm instead of thin.
function coin() {
    const out = buf(0.42);
    const f = t => (t < 0.065 ? 987.77 : 1318.51);
    tone(out, {kind: 'triangle', freq: f, amp: perc(0.002, 0.16, 0.7)});
    tone(out, {kind: 'sine', freq: t => f(t) / 2, amp: perc(0.002, 0.10, 0.25)});
    tone(out, {kind: 'sine', freq: f, amp: perc(0.002, 0.05, 0.2)});
    return finish(out);
}

// Life pickup: a major arpeggio (C6-E6-G6) that resolves upward — reads as
// "gained something" without the coin's metallic edge.
function heart() {
    const out = buf(0.6);
    const notes = [1046.5, 1318.5, 1568.0];
    notes.forEach((hz, i) => {
        const at = i * 0.055;
        const tail = i === notes.length - 1 ? 0.28 : 0.09;
        tone(out, {kind: 'sine', freq: hz, amp: perc(0.004, tail, 0.6), start: at});
        tone(out, {kind: 'sine', freq: hz * 2, amp: perc(0.004, tail * 0.5, 0.14), start: at});
    });
    return finish(out);
}

// Hazard bomb. Noise is the body here (it's an explosion), swept from bright to
// dark so it opens with a crack and collapses into a thump.
function bomb() {
    const out = buf(0.8);
    const body = buf(0.8);
    noise(body, {amp: perc(0.002, 0.17, 0.9), seed: 99});
    lowpass(body, sweep(3500, 260, 0.35));
    mixInto(out, body, 1);

    const crack = buf(0.8);
    noise(crack, {amp: perc(0.0005, 0.02, 0.6), seed: 4242});
    highpass(crack, 1800);
    mixInto(out, crack, 1);

    tone(out, {kind: 'sine', freq: sweep(120, 38, 0.3), amp: perc(0.003, 0.26, 0.8)});
    shape(out, 1.6);
    return finish(out);
}

// Shield up: a rising sweep with a fifth on top and a breath of air. Rising =
// protective/positive, matching the coin/heart direction.
function shield() {
    const out = buf(0.6);
    tone(out, {kind: 'sine', freq: sweep(280, 1120, 0.3), amp: perc(0.02, 0.22, 0.6)});
    tone(out, {kind: 'triangle', freq: sweep(420, 1680, 0.3), amp: perc(0.03, 0.18, 0.28)});
    const air = buf(0.6);
    noise(air, {amp: perc(0.05, 0.16, 0.5), seed: 555});
    lowpass(air, sweep(1200, 7000, 0.3));
    mixInto(out, air, 0.22);
    return finish(out);
}

// Slow-mo: the shield sweep inverted. Falling pitch reads as "everything is
// winding down", which is exactly what the helper does.
function slow() {
    const out = buf(0.7);
    tone(out, {kind: 'triangle', freq: sweep(1150, 210, 0.42), amp: perc(0.006, 0.30, 0.6)});
    tone(out, {kind: 'sine', freq: sweep(575, 105, 0.42), amp: perc(0.006, 0.26, 0.4)});
    return finish(out);
}

// Boss hit: a dry low thud. Deliberately blunter than `tap` so chipping at the
// boss feels like hitting something solid.
function hit() {
    const out = buf(0.16);
    tone(out, {kind: 'sine', freq: sweep(240, 85, 0.05), amp: perc(0.001, 0.055, 0.9)});
    const snap = buf(0.16);
    noise(snap, {amp: perc(0.0005, 0.008, 0.5), seed: 31337});
    highpass(snap, 2200);
    mixInto(out, snap, 0.3);
    shape(out, 1.3);
    return finish(out);
}

// Countdown tick (3·2·1). A clean, slightly soft-attacked beep — sharp enough
// to be a metronome, not so sharp it stabs three times in a row.
function countdown() {
    const out = buf(0.24);
    tone(out, {kind: 'sine', freq: 880, amp: perc(0.004, 0.065, 0.8)});
    tone(out, {kind: 'sine', freq: 1760, amp: perc(0.004, 0.030, 0.12)});
    return finish(out, 0.72); // a touch under the others: it fires 3× in a row
}

// GO!. The tick's note resolved into a major triad an octave up, with a lead-in
// sweep — the payoff after three ticks on the same pitch.
function go() {
    const out = buf(0.7);
    tone(out, {kind: 'sine', freq: sweep(560, 1500, 0.09), amp: t => perc(0.004, 0.05, 0.35)(t) * gate(0, 0.1)(t)});
    [1046.5, 1318.5, 1568.0].forEach((hz, i) => {
        tone(out, {kind: 'triangle', freq: hz, amp: perc(0.006, 0.34, 0.42 - i * 0.06), start: 0.06});
        tone(out, {kind: 'sine', freq: hz * 2, amp: perc(0.006, 0.14, 0.08), start: 0.06});
    });
    const air = buf(0.7);
    noise(air, {amp: perc(0.004, 0.05, 0.5), seed: 2024});
    highpass(air, 5000);
    mixInto(out, air, 0.12);
    return finish(out);
}

// ── Menu sounds ─────────────────────────────────────────────────────────────
// Same palette as the in-game set, but pitched a little politer: these fire
// while the player is reading a screen, not mid-round with music under them.

// Challenge reward claimed — the biggest positive outside of gameplay. A rolled
// major arpeggio that lands an octave up, over a slow bloom that glues the five
// notes into one gesture instead of five separate beeps. Longer tails than
// `heart` so it reads as a celebration rather than a pickup.
function claim() {
    const out = buf(1.0);
    const notes = [783.99, 1046.5, 1318.5, 1568.0, 2093.0]; // G5 C6 E6 G6 C7
    notes.forEach((hz, i) => {
        const at = i * 0.055;
        const tail = i === notes.length - 1 ? 0.42 : 0.13;
        tone(out, {kind: 'triangle', freq: hz, amp: perc(0.004, tail, 0.55 - i * 0.03), start: at});
        tone(out, {kind: 'sine', freq: hz * 2, amp: perc(0.004, tail * 0.4, 0.12), start: at});
    });
    tone(out, {kind: 'sine', freq: sweep(261.6, 523.25, 0.5), amp: perc(0.03, 0.34, 0.30)});
    const shimmer = buf(1.0);
    noise(shimmer, {amp: perc(0.02, 0.20, 0.5), seed: 8080});
    highpass(shimmer, 6000);
    mixInto(out, shimmer, 0.14);
    return finish(out);
}

// Shop purchase — a register "ka-ching": a short low thump for the drawer, then
// two bright bells a fourth apart. Deliberately shorter and less ceremonial than
// `claim`; buying is a transaction, claiming is a payoff.
function purchase() {
    const out = buf(0.55);
    tone(out, {kind: 'sine', freq: sweep(180, 90, 0.06), amp: perc(0.001, 0.05, 0.7)});
    [1568.0, 2093.0].forEach((hz, i) => { // G6 → C7
        const at = 0.035 + i * 0.075;
        tone(out, {kind: 'triangle', freq: hz, amp: perc(0.002, i ? 0.20 : 0.09, 0.5), start: at});
        tone(out, {kind: 'sine', freq: hz * 3, amp: perc(0.002, 0.045, 0.10), start: at});
    });
    const tick = buf(0.55);
    noise(tick, {amp: perc(0.0005, 0.004, 0.5), seed: 606});
    highpass(tick, 5000);
    mixInto(out, tick, 0.3);
    return finish(out);
}

// Equip / select — the quietest of the set. A two-note snap up a fifth with a
// tick on the front. It fires on every list tap, so it has to be felt more than
// heard: anything with a tail smears when the player tries several skins in a
// row, which is exactly what people do in a shop.
function equip() {
    const out = buf(0.2);
    const f = t => (t < 0.04 ? 880.0 : 1318.51); // A5 → E6
    tone(out, {kind: 'triangle', freq: f, amp: perc(0.001, 0.055, 0.7)});
    tone(out, {kind: 'sine', freq: t => f(t) * 2, amp: perc(0.001, 0.022, 0.15)});
    const tick = buf(0.2);
    noise(tick, {amp: perc(0.0005, 0.002, 0.5), seed: 1212});
    highpass(tick, 5500);
    mixInto(out, tick, 0.25);
    return finish(out);
}

// Locked / can't afford — the only downward, dissonant sound in the game. That
// contrast is what makes it read as "no". Lowpassed and normalised under the
// others on purpose: it should inform, not punish someone for tapping a locked
// item to see what it is.
function denied() {
    const out = buf(0.34);
    const f = t => (t < 0.075 ? 415.30 : 349.23); // G#4 → F4
    tone(out, {kind: 'square', freq: f, amp: perc(0.004, 0.075, 0.45)});
    tone(out, {kind: 'sine', freq: t => f(t) / 2, amp: perc(0.004, 0.09, 0.30)});
    lowpass(out, 2200);
    return finish(out, 0.7);
}

// ── Run ─────────────────────────────────────────────────────────────────────

const SOUNDS = {
    'tap.wav': tap,
    'coin.wav': coin,
    'heart.wav': heart,
    'bomb.wav': bomb,
    'shield.wav': shield,
    'slow.wav': slow,
    'hit.wav': hit,
    'countdown.wav': countdown,
    'go.wav': go,
    'claim.wav': claim,
    'purchase.wav': purchase,
    'equip.wav': equip,
    'denied.wav': denied,
};

console.log(`Generating ${Object.keys(SOUNDS).length} SFX @ ${SR}Hz mono 16-bit`);
for (const [name, make] of Object.entries(SOUNDS)) writeWav(name, make());
console.log(`\nWritten to:\n${OUT_DIRS.map(d => `  ${d}`).join('\n')}`);
