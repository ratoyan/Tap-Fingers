import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import CountUp from '../CountUp/CountUp.tsx';
import {ms, vs} from '../../../utils/responsive.ts';

// ── Stat tile ───────────────────────────────────────────────────────────────
// One figure from the player's record, as a tile in the row under the hero. The
// old screen listed these as key/value text rows, which read like a settings
// page; a tile per number lets the icon carry the meaning and gives the count-up
// something to land in.
//
// `tint` colours the icon disc, the value and the tile's rim, so a row of tiles
// stays legible at a glance instead of being three identical purple boxes.

interface StatTileProps {
    icon: string;
    label: string;
    value: number;
    tint: string;
    /** Stagger the row: each tile's count-up starts a beat after the last. */
    delay?: number;
}

function StatTile({icon, label, value, tint, delay = 0}: StatTileProps) {
    return (
        <View style={[styles.tile, {borderColor: `${tint}55`}]}>
            <LinearGradient
                colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)']}
                start={{x: 0, y: 0}}
                end={{x: 0.6, y: 1}}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.iconDisc, {backgroundColor: `${tint}26`, borderColor: `${tint}66`}]}>
                <Text allowFontScaling={false} style={styles.icon}>{icon}</Text>
            </View>
            <CountUp value={value} delay={delay} style={[styles.value, {color: tint}]} />
            <Text allowFontScaling={false} style={styles.label} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    tile: {
        flex: 1,
        borderRadius: ms(20),
        borderWidth: 1,
        paddingVertical: vs(13),
        paddingHorizontal: ms(6),
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconDisc: {
        width: ms(38),
        height: ms(38),
        borderRadius: ms(19),
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(7),
    },
    icon: {
        fontSize: ms(18),
    },
    value: {
        fontSize: ms(20),
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    label: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: ms(10.5),
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginTop: vs(3),
        textAlign: 'center',
    },
});

export default React.memo(StatTile);
