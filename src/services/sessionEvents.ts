// ── Session events ────────────────────────────────────────────────────────────
// Decouples the axios layer from the auth store / navigation. `api.ts` emits
// "unauthorized" when a 401 can't be recovered (no refresh token, or the
// refresh itself fails); the auth store registers the handler that tears down
// the local session and sends the user back to Welcome. Keeping this indirection
// avoids a circular import (api ← authService ← authStore).

type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(h: UnauthorizedHandler) {
    handler = h;
}

export function emitUnauthorized() {
    handler?.();
}
