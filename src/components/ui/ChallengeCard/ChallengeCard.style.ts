import {StyleSheet} from "react-native";
import {DARK_PURPLE, GOLD, MEDIUM_PURPLE, PURPLE_DARK, WHITE, WHITE_100} from "../../../constants/colors.ts";

export default StyleSheet.create({
    card: {
        marginHorizontal: 10,
        marginBottom: 16,
        borderRadius: 22,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    cardInner: {
        padding: 18,
    },
    // ── Header row ──────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 24,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: WHITE,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    // ── Status badge ────────────────────────────
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    // ── Progress bar ────────────────────────────
    progressTrack: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 10,
    },
    progressLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    progressText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    // ── Footer ──────────────────────────────────
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    rewardText: {
        color: GOLD,
        fontWeight: '700',
        fontSize: 13,
    },
    // collect button
    collectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: GOLD,
    },
    collectText: {
        color: DARK_PURPLE,
        fontWeight: '900',
        fontSize: 13,
    },
    // locked
    lockedSubtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        marginTop: 6,
    },
});
