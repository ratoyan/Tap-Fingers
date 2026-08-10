import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {ms, vs} from '../../../utils/responsive.ts';

// ── Section card ────────────────────────────────────────────────────────────
// The frame every editable block on the Profile screen sits in: a glassy panel
// with an icon-led title and a hairline rule under it. One component so the
// name / email / password / confirm-code blocks can't drift apart in padding,
// radius or label casing the way four hand-rolled Views did.
//
// `tone` only shifts the rim and the wash — 'alert' for the confirm-your-email
// card, which has to stand out from the ordinary settings around it.

type Tone = 'default' | 'alert';

const TONES: Record<Tone, {fill: string[]; border: string; title: string}> = {
    default: {
        fill: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.05)'],
        border: 'rgba(255,255,255,0.20)',
        title: 'rgba(255,255,255,0.75)',
    },
    alert: {
        fill: ['rgba(247,151,30,0.20)', 'rgba(247,151,30,0.07)'],
        border: 'rgba(247,151,30,0.60)',
        title: '#FFD8A8',
    },
};

interface SectionCardProps {
    icon: string;
    title: string;
    tone?: Tone;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

function SectionCard({icon, title, tone = 'default', style, children}: SectionCardProps) {
    const t = TONES[tone];
    // A plain View carries the border, radius and padding; the gradient is an
    // absolute-fill background behind the content. Using the LinearGradient as the
    // padded container itself renders a second, inset frame on iOS new arch (the
    // gradient lays down its fill box inside the border box) — so the whole card
    // read as a card-in-a-card. This is the same pattern ProfileHero and the
    // action buttons already use.
    return (
        <View style={[styles.card, {borderColor: t.border}, style]}>
            <LinearGradient
                pointerEvents="none"
                colors={t.fill}
                start={{x: 0, y: 0}}
                end={{x: 0.8, y: 1}}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.header}>
                <Text allowFontScaling={false} style={styles.icon}>{icon}</Text>
                <Text allowFontScaling={false} style={[styles.title, {color: t.title}]} numberOfLines={1}>
                    {title}
                </Text>
            </View>
            <View style={[styles.rule, {backgroundColor: t.border}]} />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: ms(22),
        borderWidth: 1,
        // Clip the absolute-fill gradient background to the rounded corners.
        overflow: 'hidden',
        paddingHorizontal: ms(16),
        paddingTop: vs(14),
        paddingBottom: vs(16),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
    },
    icon: {
        fontSize: ms(15),
    },
    title: {
        flex: 1,
        fontSize: ms(12.5),
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    rule: {
        height: 1,
        opacity: 0.6,
        marginTop: vs(10),
        marginBottom: vs(13),
    },
});

export default React.memo(SectionCard);
