---
description: Build a signed release APK with demo (test) Yandex ad units
allowed-tools: PowerShell, Bash, Read
---

Build the test APK for this project.

Run `npm run build-apk` (which is `node scripts/build.js apk`) from the repo root
in the **background** — a release Gradle build takes several minutes, so do not
block on it in the foreground.

While it runs, do not poll. Wait for the completion notification, then read the
task output file and report:

- Whether the build succeeded.
- **The absolute path to the APK, always.** The script prints it on the last
  line; repeat it in the report on its own line, verbatim and unabbreviated
  (`C:\webix-games\Tap-Fingers\android\app\build\outputs\apk\release\app-release.apk`),
  so it can be copied straight into a file manager or an `adb install`. Never
  shorten it to a repo-relative path and never omit it because it "was in the
  build output" — the path is the deliverable of this command.
- If it failed: the actual Gradle error lines (strip ANSI escapes with
  `sed 's/\x1b\[[0-9;]*m//g'` before grepping), plus what to do about it.

Facts worth stating in the report, because they are the point of this command:

- This APK carries the **demo** Yandex ad unit IDs (`demo-rewarded-yandex`,
  `demo-banner-yandex`). Ads render, but no real fill is served and clicks are
  safe — this build is for testing, never for the Play Store.
- It is signed with the real release keystore (`keystore/tapfingers-release.keystore`),
  so it installs over previous release builds.
- It talks to the **production** backend (`https://tapfingers.webixworld.com/api`).
  `src/services/config.ts` picks the URL off `__DEV__`, so only a Metro-served
  debug build reaches the local Laravel server. Never point a release build at
  the local backend: `10.0.2.2` resolves nowhere outside an emulator, and the
  release manifest sets `usesCleartextTraffic="false"`, which blocks `http://`.

Do not edit `src/utils/adsEnv.ts` by hand — `scripts/build.js` owns that file.
