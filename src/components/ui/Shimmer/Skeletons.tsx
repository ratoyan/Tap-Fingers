import React from 'react';
import {View} from 'react-native';
import Shimmer from './Shimmer.tsx';
import {ms, vs} from '../../../utils/responsive.ts';
import {HORIZONAL_OFFSET} from '../../../constants/uiConstants.ts';

// ── Loading skeletons ───────────────────────────────────────────────────────
// One per list screen, each mirroring the shape of the rows it stands in for so
// the layout doesn't jump when the real content arrives. The counts are "about
// a screenful" — enough to fill the viewport, not the whole list.
//
// Every block is staggered by its index so the sweeps run as a cascade down the
// screen rather than all flashing together.

const STAGGER = 90;

/** Shop: the two-column grid of item cards. */
export function ShopSkeleton() {
    return (
        <View style={{paddingHorizontal: HORIZONAL_OFFSET, marginTop: 20}}>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
                {Array.from({length: 6}, (_, i) => (
                    <Shimmer
                        key={i}
                        width="48%"
                        height={vs(200)}
                        radius={ms(24)}
                        delay={i * STAGGER}
                        style={{marginBottom: ms(16)}}
                    />
                ))}
            </View>
        </View>
    );
}

/**
 * Progression: leaderboard rows — rank dot, name/bar block.
 *
 * Trimmed for the same reason as ChallengesSkeleton below: at seven rows of
 * four blocks this was 28 Shimmers, ~110ms of mount, and the only thing the
 * screen had to build before the push animation could start. Five rows of
 * three still fill the viewport and read as the same list.
 */
export function ProgressionSkeleton() {
    return (
        <View style={{marginTop: 20, paddingHorizontal: ms(10)}}>
            {Array.from({length: 10}, (_, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: vs(20),
                        paddingHorizontal: ms(18),
                        borderRadius: ms(24),
                        marginBottom: ms(16),
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.15)',
                    }}
                >
                    <Shimmer width={ms(50)} height={ms(50)} radius={ms(23)} delay={i * STAGGER}/>
                    <View style={{flex: 1, marginLeft: ms(14)}}>
                        <Shimmer width="60%" height={vs(16)} radius={6} delay={i * STAGGER + 40}/>
                        <Shimmer
                            width="100%"
                            height={ms(15)}
                            radius={ms(15)}
                            delay={i * STAGGER + 80}
                            style={{marginTop: vs(10)}}
                        />
                    </View>
                </View>
            ))}
        </View>
    );
}

/**
 * Challenges: cards with a title block and a progress bar.
 *
 * Deliberately coarser than the other two. This one sits *below* the daily
 * challenges, which are real cards that render straight away — so it only has
 * to cover the rest of the viewport, not sell a full screen of content. Every
 * Shimmer is five native views and two native animation loops, and the version
 * that mirrored the card line for line (five cards x five blocks) cost ~70ms
 * of mount on its own: the loading state was a third of what made the screen
 * slow to open.
 */
export function ChallengesSkeleton() {
    return (
        <View style={{marginTop: 20}}>
            {Array.from({length: 3}, (_, i) => (
                <View
                    key={i}
                    style={{
                        marginHorizontal: ms(10),
                        marginBottom: ms(16),
                        borderRadius: ms(22),
                        padding: ms(20),
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                    }}
                >
                    {/* Header: icon + title line */}
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Shimmer width={ms(50)} height={ms(50)} radius={ms(14)} delay={i * STAGGER}/>
                        <View style={{flex: 1, marginLeft: ms(12)}}>
                            <Shimmer width="70%" height={vs(20)} radius={6} delay={i * STAGGER + 40}/>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <Shimmer
                        width="100%"
                        height={ms(10)}
                        radius={ms(10)}
                        delay={i * STAGGER + 80}
                        style={{marginTop: vs(16), marginBottom: vs(6)}}
                    />
                </View>
            ))}
        </View>
    );
}
