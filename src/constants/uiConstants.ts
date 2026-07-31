import {ms, isTablet, SH, SW} from '../utils/responsive.ts';

export const TOP_OFFSET       = ms(10);
export const HORIZONAL_OFFSET = ms(isTablet ? 32 : 20);

/**
 * Default on-screen size for the logo, in dp.
 *
 * The artwork is square, so it's one number rather than a width/height pair.
 * Derived from *both* axes on purpose: sizing off the width alone blows the
 * logo up on wide-but-short devices, off the height alone leaves it shrunken
 * on narrow ones — the smaller of the two always fits. The final cap stops it
 * from becoming a poster on tablets, where 52% of the width is huge.
 */
export const LOGO_SIZE = Math.round(
    Math.min(SW * 0.52, SH * 0.28, isTablet ? 260 : 200),
);
