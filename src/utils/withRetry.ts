// Runs `fn`, retrying with exponential backoff on failure. Exists to ride out
// transient server-overload blocks: the API lives on a shared host whose
// Imunify360 bot-protection sheds automation traffic (our native client) when
// the box is busy, returning "Access denied by Imunify360 bot-protection".
// That state clears within seconds, so a couple of spaced retries let the
// request succeed instead of failing outright. Delays: baseDelayMs * 2^i
// (default 1s, 2s, 4s across 3 attempts).
//
// Used by session bootstrap (authStore) and the game-end submit (Play), both of
// which would otherwise lose their result to a single shed request.
export async function withRetry<T>(
    fn: () => Promise<T>,
    attempts = 3,
    baseDelayMs = 1000,
): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (i < attempts - 1) {
                await new Promise<void>(resolve =>
                    setTimeout(() => resolve(), baseDelayMs * 2 ** i),
                );
            }
        }
    }
    throw lastError;
}
