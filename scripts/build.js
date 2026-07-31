#!/usr/bin/env node
/**
 * Release build entry point — the one place that decides which Yandex ad units a
 * build ships with.
 *
 *   node scripts/build.js apk   →  demo ad units, assembleRelease  →  .apk
 *   node scripts/build.js aab   →  REAL ad units, bundleRelease    →  .aab
 *
 * The switch works by rewriting src/utils/adsEnv.ts before handing over to
 * Gradle. Writing a file (rather than passing an env var) is deliberate: Metro
 * keys its transform cache on file contents, so the flip can never be served
 * from a stale cache the way an inlined `process.env` read can.
 *
 * The 'prod' flag is reverted as soon as Gradle returns — including on failure
 * and on Ctrl-C. A working tree left on 'prod' would make the next
 * `npm run android` request real ads from a dev machine, and those impressions
 * count as invalid traffic against the account.
 */
const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const ADS_ENV_FILE = path.join(ROOT, 'src', 'utils', 'adsEnv.ts');
const AD_UNITS_FILE = path.join(ROOT, 'src', 'utils', 'adUnits.ts');

const TARGETS = {
    apk: {
        adsEnv: 'demo',
        gradleTask: 'assembleRelease',
        artifact: path.join(ANDROID_DIR, 'app/build/outputs/apk/release/app-release.apk'),
    },
    aab: {
        adsEnv: 'prod',
        gradleTask: 'bundleRelease',
        artifact: path.join(ANDROID_DIR, 'app/build/outputs/bundle/release/app-release.aab'),
    },
};

const target = TARGETS[process.argv[2]];
if (!target) {
    console.error('Usage: node scripts/build.js apk|aab');
    process.exit(1);
}

function fail(msg) {
    console.error(`\n✖ ${msg}\n`);
    process.exit(1);
}

// The placeholders shipped in adUnits.ts. Their presence means the real units
// were never pasted in, so a 'prod' build would quietly request an ID that
// doesn't exist — no fill, no revenue, and no error loud enough to notice after
// release.
//
// Only the android block is checked: this script produces an Android artifact,
// and the iOS units are never read by it. Gating an AAB on unset iOS IDs would
// block a perfectly shippable Play Store build. The iOS side gets its own check
// whenever an iOS release path is added here.
function assertRealUnitsPresent() {
    const src = fs.readFileSync(AD_UNITS_FILE, 'utf8');
    const block = src.match(/android:\s*\{([^}]*)\}/);
    if (!block) fail(`Could not find the android unit block in ${AD_UNITS_FILE}`);

    const leftovers = block[1].match(/R-M-(?:X+|Y+)-\d+/g);
    if (leftovers) {
        fail(
            'Refusing to build an AAB with placeholder ad unit IDs.\n' +
            `  Still unset in the android block of src/utils/adUnits.ts: ${[...new Set(leftovers)].join(', ')}\n` +
            '  Paste the real R-M-<appId>-<index> units from the Yandex Partner interface first.',
        );
    }
}

// Only rewrite when the value actually changes: an unnecessary write bumps the
// mtime and costs Gradle its up-to-date check on the bundle task.
function setAdsEnv(value) {
    const src = fs.readFileSync(ADS_ENV_FILE, 'utf8');
    const next = src.replace(
        /export const ADS_ENV: 'demo' \| 'prod' = '(?:demo|prod)';/,
        `export const ADS_ENV: 'demo' | 'prod' = '${value}';`,
    );
    if (next === src) return;
    if (!next.includes(`= '${value}';`)) {
        fail(`Could not find the ADS_ENV declaration in ${ADS_ENV_FILE}`);
    }
    fs.writeFileSync(ADS_ENV_FILE, next);
}

if (target.adsEnv === 'prod') assertRealUnitsPresent();

// Restore before exiting, however we get there.
let restored = false;
function restore() {
    if (restored || target.adsEnv !== 'prod') return;
    restored = true;
    setAdsEnv('demo');
}
process.on('exit', restore);
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

setAdsEnv(target.adsEnv);

console.log(`\n▸ ads: ${target.adsEnv === 'prod' ? 'REAL Yandex units' : 'demo units'}`);
console.log(`▸ gradle: ${target.gradleTask}\n`);

// .bat files can only be spawned through a shell on Windows (Node refuses to
// exec them directly), and the wrapper has to be named by absolute path: this
// machine runs with NoDefaultCurrentDirectoryInExePath set, so cmd.exe does not
// look in its own working directory and a bare `gradlew.bat` is "not recognized".
// The path is quoted because shell:true flattens argv into one command string.
const isWin = process.platform === 'win32';
const gradlew = path.join(ANDROID_DIR, isWin ? 'gradlew.bat' : 'gradlew');
const result = spawnSync(isWin ? `"${gradlew}"` : gradlew, [target.gradleTask], {
    cwd: ANDROID_DIR,
    stdio: 'inherit',
    shell: isWin,
});

restore();

if (result.error) fail(`Could not run Gradle: ${result.error.message}`);
if (result.status !== 0) process.exit(result.status);

if (fs.existsSync(target.artifact)) {
    // Absolute path, plus size: this line is the whole point of the build for
    // whoever has to upload or sideload the artifact, so it should be copyable
    // straight out of the terminal without resolving anything by hand.
    const mb = (fs.statSync(target.artifact).size / 1024 / 1024).toFixed(1);
    console.log(`\n✔ ${target.gradleTask} done — ${mb} MB`);
    console.log(`${target.artifact}\n`);
} else {
    fail(`Gradle reported success but ${target.artifact} is missing.`);
}
