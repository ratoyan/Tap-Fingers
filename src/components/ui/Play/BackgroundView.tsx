import React from 'react';
import {Image, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ── Equipped background ───────────────────────────────────────────────────────
// A picture an admin uploaded, over the flat colours the catalog names for it.
//
// Both layers come from the backend (shop_items.bg_image_path / bg_colors), so a
// new background — or new artwork for an existing one — needs no app release.
// The app owns none of it beyond the fallback below.
//
// The colours are not decoration: they are what fills the screen for the moment
// the picture is still downloading, and the whole of the look for a background
// nobody has uploaded art for yet. Painting them *underneath* rather than
// swapping between the two is what keeps that transition from being a flash of
// black — the picture simply arrives over the top of a screen that already looks
// finished.
//
// Used both behind the Play arena and as the shop preview, on purpose: a shop
// card that draws the real thing can't promise a look the game doesn't deliver.

// Last resort, for a background whose catalog row has no usable colours (a first
// launch with no cached catalog, or a field an admin cleared). Kept in step with
// the admin panel's BG_DEFAULT_COLORS, which previews against the same ramp.
const DEFAULT_COLORS = ['#050a24', '#141a4d', '#3b1f6e', '#8c3f6b', '#e0714a', '#f7b267'];

// The forms the admin panel accepts, and so the only shapes the catalog should
// ever contain.
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * The stops actually handed to the native gradient.
 *
 * Filtered rather than trusted, because these are admin-authored text that has
 * travelled through a database and a cache, and a single stop the native side
 * can't parse doesn't degrade — it throws while updating the view's `colors`
 * property and takes the whole screen with it. One typo in the panel is not
 * worth a black Play screen, so anything that isn't a colour is dropped and the
 * rest still paints.
 */
function toStops(colors?: string[] | null): string[] {
    const valid = (colors ?? [])
        .map(c => (typeof c === 'string' ? c.trim() : ''))
        .filter(c => HEX.test(c));

    if (!valid.length) {
        return DEFAULT_COLORS;
    }
    // LinearGradient needs two stops, so a lone colour is doubled rather than
    // rejected — that is how the admin panel says "flat, no gradient".
    return valid.length === 1 ? [valid[0], valid[0]] : valid;
}

interface BackgroundViewProps {
    // Absolute URL of the uploaded picture, already resolved against the API
    // origin (see shopVisuals). Null/undefined → colours only.
    imageUrl?: string | null;
    // Catalog colours, top → bottom. One is allowed and fills flat — a
    // background whose artwork is a single colour has nothing to ramp between.
    colors?: string[] | null;
    // Extra positioning for the container. Play fills the screen behind the
    // arena; the shop fills its card.
    style?: ViewStyle;
}

function BackgroundView({imageUrl, colors, style}: BackgroundViewProps) {
    const stops = toStops(colors);

    return (
        <LinearGradient
            colors={stops}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={[styles.fill, style]}
        >
            {imageUrl ? (
                // `cover` rather than `contain`: the picture is the whole
                // backdrop, and letterboxing it would show bands of the fallback
                // ramp down the sides, which reads as a broken image rather than
                // as a deliberate frame.
                <Image
                    source={{uri: imageUrl}}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            ) : null}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default React.memo(BackgroundView);
