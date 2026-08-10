import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Dimensions, Easing, View} from 'react-native';
import uuId from 'react-native-uuid';

import {useShopStore} from '../../../store/shopStore.ts';
import {resolveCardEntry} from '../../../data/shopVisuals.ts';
import {colors} from '../../../data/play.ts';
import {scale} from '../../../utils/responsive.ts';
import PlayBox from '../Play/PlayBox.tsx';

const {width, height} = Dimensions.get('window');

// Three cards, side by side, falling together as a little cluster.
const COUNT = 3;
// Fall speed (ms top→bottom). Shared so the three stay locked side by side
// instead of drifting apart.
const FALL_MS = 3200;
// Gap between the three boxes so they read as side by side, not overlapping.
const GROUP_GAP = 8;
// Per-box vertical stagger: the 2nd sits 30px below the 1st, the 3rd another
// 10px below the 2nd — a gentle downward step across the cluster.
const Y_OFFSETS = [0, 20, 10];
// Start at the top of the fall (not mid-screen) so the cluster drops in from
// TOP_OFFSET rather than appearing halfway down.
const START_PHASE = 0;
// Where the fall begins, measured from the top of the screen — the boxes come in
// 100px down rather than from the very top edge.
const TOP_OFFSET = 100;
// Same big-screen shrink the Play field uses, so a card that looks right on a
// phone doesn't balloon on a tablet.
const BIG_SCREEN_FACTOR = width > 500 ? 0.8 : 1;
const boxScale = (size: number) => Math.round(scale(size) * BIG_SCREEN_FACTOR);

// A falling instance: the equipped card wrapped in a box shaped like the ones
// Play spawns (PlayBox renders it), the column it drops down, and the animated
// value that walks it from above the screen to below it.
function makeFaller(card: any, index: number) {
    const size = card.size ? boxScale(card.size) : boxScale(100);
    const box = {
        ...card,
        size,
        // Admin SVG art draws at its authored width/height — shrink those on a big
        // screen too so a custom card isn't the one drop still coming down full-size.
        ...(card.width ? {width: Math.round(card.width * BIG_SCREEN_FACTOR)} : null),
        ...(card.height ? {height: Math.round(card.height * BIG_SCREEN_FACTOR)} : null),
        id: uuId.v4(),
        // The parent Animated.View owns the placement; PlayBox positions itself at
        // its own origin, so the box's own x/y stay at 0.
        x: 0,
        y: 0,
        rotation: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        node: null as any,
        __dead: false,
        isBoom: false,
        isGolden: false,
        isFreeze: false,
        isGift: false,
        isBomb: false,
        isHeart: false,
        isBarrel: false,
    };
    // Lay the three out side by side, centred as a group, so they fall next to
    // each other instead of from separate columns.
    const groupWidth = COUNT * size + (COUNT - 1) * GROUP_GAP;
    const startX = Math.max(0, (width - groupWidth) / 2);
    const left = Math.round(startX + index * (size + GROUP_GAP));
    return {
        key: box.id,
        box,
        size,
        left,
        // Shared fall speed + start phase → the cluster stays locked together.
        duration: FALL_MS,
        phase: START_PHASE,
        // The downward step across the cluster (1st / 2nd / 3rd).
        yOffset: Y_OFFSETS[index] ?? 0,
        anim: new Animated.Value(START_PHASE),
    };
}

// The Progression / list loading state: the equipped card raining down the way it
// falls on the Play screen, in place of a shimmer skeleton.
function FallingBoxesLoader() {
    const storeCard = useShopStore(s => s.card);
    const card = useMemo(() => storeCard ?? resolveCardEntry(null), [storeCard]);

    // Rebuild the fallers whenever the equipped skin changes (a different card
    // should rain while it's loading), otherwise keep them stable across renders.
    const fallers = useMemo(
        () => Array.from({length: COUNT}, (_, i) => makeFaller(card, i)),
        [card],
    );

    useEffect(() => {
        const loops: Animated.CompositeAnimation[] = [];
        fallers.forEach(f => {
            // Start mid-fall at the box's phase, then loop cleanly from the top —
            // so the column looks full immediately and stays evenly staggered.
            const lead = Animated.timing(f.anim, {
                toValue: 1,
                duration: Math.round(f.duration * (1 - f.phase)),
                easing: Easing.linear,
                useNativeDriver: true,
            });
            lead.start(({finished}) => {
                if (!finished) return;
                f.anim.setValue(0);
                const loop = Animated.loop(
                    Animated.timing(f.anim, {
                        toValue: 1,
                        duration: f.duration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                );
                loops.push(loop);
                loop.start();
            });
            loops.push(lead);
        });
        return () => loops.forEach(l => l.stop());
    }, [fallers]);

    return (
        <View style={{flex: 1}} pointerEvents="none">
            {fallers.map(f => (
                <Animated.View
                    key={f.key}
                    style={{
                        position: 'absolute',
                        // Anchored at the very top (position 0); TOP_OFFSET (+100)
                        // below is applied through the translateY.
                        top: 0,
                        left: f.left,
                        transform: [
                            {
                                translateY: f.anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [TOP_OFFSET + f.yOffset, height + f.size + f.yOffset],
                                }),
                            },
                        ],
                    }}
                >
                    <PlayBox box={f.box} handlePress={() => {}}/>
                </Animated.View>
            ))}
        </View>
    );
}

export default FallingBoxesLoader;
