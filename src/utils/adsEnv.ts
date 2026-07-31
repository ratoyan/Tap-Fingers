// GENERATED FILE — rewritten by scripts/build.js on every build.
//
// 'demo' → Yandex demo units: no real fill is ever served and clicks are safe.
// 'prod' → the real Yandex Partner units from adUnits.ts.
//
// It is committed as 'demo' on purpose: a plain `npm run android`, a CI build or
// a fresh clone must never request real ads, because impressions and clicks off
// a dev machine count as invalid traffic. Only `npm run build-aab` flips it to
// 'prod', and it flips back the moment that build finishes.
export const ADS_ENV: 'demo' | 'prod' = 'demo';
