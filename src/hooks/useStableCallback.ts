import {useCallback, useRef} from 'react';

/**
 * Returns a callback whose identity never changes but which always calls the
 * latest version of `fn`.
 *
 * Play's animation loop re-renders the screen every frame, so any handler
 * declared as a plain function in the body gets a fresh identity 60×/sec —
 * which defeats React.memo on every child it is passed to. Latching the
 * function in a ref keeps the prop stable without having to hand-maintain a
 * dependency array for each handler.
 */
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
    const ref = useRef(fn);
    ref.current = fn;
    return useCallback(((...args: any[]) => ref.current(...args)) as T, []);
}

export default useStableCallback;
