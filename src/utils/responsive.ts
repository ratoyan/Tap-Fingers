import {Dimensions} from 'react-native';

const {width: W, height: H} = Dimensions.get('window');

// Reference design — iPhone 14 (375 × 812)
const BASE_W = 375;
const BASE_H = 812;

/** Scale based on screen width */
export const scale = (size: number): number => (W / BASE_W) * size;

/** Scale based on screen height */
export const vs = (size: number): number => (H / BASE_H) * size;

/**
 * Moderate scale — grows slower than full scale.
 * factor 0 = no scale, factor 1 = full scale.
 * Default factor 0.35 works well for fonts & padding.
 */
export const ms = (size: number, factor = 0.35): number =>
    Math.round(size + (scale(size) - size) * factor);

/** True on tablets (≥ 600 dp wide — covers iPad & Android tablets) */
export const isTablet: boolean = W >= 600;

/** Screen width / height (dp) */
export const SW = W;
export const SH = H;
