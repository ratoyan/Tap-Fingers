---
description: Build the Play Store AAB with the real Yandex ad units
allowed-tools: PowerShell, Bash, Read
---

Build the production Android App Bundle for this project.

Run `npm run build-aab` (which is `node scripts/build.js aab`) from the repo root
in the **background** — a release Gradle build takes several minutes, so do not
block on it in the foreground.

While it runs, do not poll. Wait for the completion notification, then read the
task output file and report:

- Whether the build succeeded.
- **The absolute path to the AAB, always.** The script prints it on the last
  line; repeat it in the report on its own line, verbatim and unabbreviated
  (`C:\webix-games\Tap-Fingers\android\app\build\outputs\bundle\release\app-release.aab`),
  so it can be dragged straight into the Play Console upload dialog. Never
  shorten it to a repo-relative path and never omit it because it "was in the
  build output" — the path is the deliverable of this command.
- If it failed: the actual Gradle error lines (strip ANSI escapes with
  `sed 's/\x1b\[[0-9;]*m//g'` before grepping), plus what to do about it.

**Expected early failure while the Yandex units are unset.** The script refuses
to build and prints "Refusing to build an AAB with placeholder ad unit IDs",
listing the `R-M-XXXXXXX-…` placeholders still in `src/utils/adUnits.ts`. That is
the guard working, not a bug. When it fires, tell the user to create the units in
the Yandex Partner interface (one **Banner** with type *Adaptive sticky*, one
**Rewarded**, per store app) and paste the real `R-M-<appId>-<index>` values into
the `PROD` table in `src/utils/adUnits.ts`. Offer to paste them in for them.

Facts worth stating in the report, because they are the point of this command:

- This bundle carries the **real** Yandex ad unit IDs — it is the only build that
  does. Do not install it on a dev device to "check the ads": impressions and
  clicks from a dev machine count as invalid traffic against the account.
- It talks to the **production** backend (`https://tapfingers.webixworld.com/api`),
  chosen off `__DEV__` in `src/services/config.ts`. A bundle built against the
  local Laravel server would be dead on every real device.
- `scripts/build.js` flips `src/utils/adsEnv.ts` back to `'demo'` as soon as
  Gradle returns, including on failure. After reporting, confirm the file is back
  on `'demo'` — if it is not, set it back and say so.

Do not edit `src/utils/adsEnv.ts` by hand otherwise — `scripts/build.js` owns it.
