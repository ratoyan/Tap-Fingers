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

/** Progression: leaderboard rows — rank dot, name/bar block, score. */
export function ProgressionSkeleton() {
    return (
        <View style={{marginTop: 20, paddingHorizontal: ms(10)}}>
            {Array.from({length: 7}, (_, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: vs(14),
                        paddingHorizontal: ms(18),
                        borderRadius: ms(24),
                        marginBottom: ms(16),
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.15)',
                    }}
                >
                    <Shimmer width={ms(46)} height={ms(46)} radius={ms(23)} delay={i * STAGGER}/>
                    <View style={{flex: 1, marginLeft: ms(14)}}>
                        <Shimmer width="60%" height={vs(13)} radius={6} delay={i * STAGGER + 40}/>
                        <Shimmer
                            width="100%"
                            height={ms(10)}
                            radius={ms(10)}
                            delay={i * STAGGER + 80}
                            style={{marginTop: vs(10)}}
                        />
                    </View>
                    <Shimmer width={ms(34)} height={vs(15)} radius={6} delay={i * STAGGER + 120} style={{marginLeft: ms(12)}}/>
                </View>
            ))}
        </View>
    );
}

/** Challenges: cards with a title block, a progress bar and a reward row. */
export function ChallengesSkeleton() {
    return (
        <View style={{marginTop: 20}}>
            {Array.from({length: 5}, (_, i) => (
                <View
                    key={i}
                    style={{
                        marginHorizontal: ms(10),
                        marginBottom: ms(16),
                        borderRadius: ms(22),
                        padding: ms(18),
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                    }}
                >
                    {/* Header: icon, title lines, status badge */}
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Shimmer width={ms(44)} height={ms(44)} radius={ms(14)} delay={i * STAGGER}/>
                        <View style={{flex: 1, marginLeft: ms(12)}}>
                            <Shimmer width="70%" height={vs(14)} radius={6} delay={i * STAGGER + 40}/>
                            <Shimmer width="45%" height={vs(11)} radius={6} delay={i * STAGGER + 70} style={{marginTop: vs(7)}}/>
                        </View>
                        <Shimmer width={ms(70)} height={vs(20)} radius={ms(10)} delay={i * STAGGER + 100}/>
                    </View>

                    {/* Progress bar */}
                    <Shimmer
                        width="100%"
                        height={ms(10)}
                        radius={ms(10)}
                        delay={i * STAGGER + 130}
                        style={{marginTop: vs(16), marginBottom: vs(6)}}
                    />

                    {/* Reward row */}
                    <Shimmer width="40%" height={vs(13)} radius={6} delay={i * STAGGER + 160} style={{marginTop: vs(10)}}/>
                </View>
            ))}
        </View>
    );
}
