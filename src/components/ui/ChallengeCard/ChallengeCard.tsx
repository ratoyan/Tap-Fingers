import React, {useEffect, useRef, useState} from "react";
import {Animated, Text, TouchableOpacity, View} from "react-native";
import {useTranslation} from "react-i18next";

// icons
import Coin from "../../../assets/icons/Coin.tsx";

// styles
import styles from './ChallengeCard.style.ts';
import {
    DARK_PURPLE,
    GOLD,
    GRADIENT_DARK,
    GRADIENT_LIGHT,
    LIGHT_GREEN,
    PURPLE_DARK,
} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";
import {vs} from "../../../utils/responsive.ts";

interface ChallengeCardProps {
    item: any;
    index?: number;
    onCollect?: () => void;
}

function ChallengeCard({item, index = 0, onCollect}: ChallengeCardProps) {

    const {t} = useTranslation();
    const entranceOpacity = useRef(new Animated.Value(0)).current;
    const entranceX = useRef(new Animated.Value(-30)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const collectPulse = useRef(new Animated.Value(1)).current;

    // Claim animation: 0 -> 1 drives the card punch, the gold flash and the
    // coin that flies up out of the button. Kept as one value so every part
    // stays in sync, and native-driven (transform/opacity only).
    const claim = useRef(new Animated.Value(0)).current;
    // The flash and the flying coin only exist while a claim is playing. They
    // used to be mounted on every card for the card's whole life — including
    // the Coin SVG, which is ~9 paths and the single most expensive node in
    // here. Paid on every row of the list, for decoration almost none of them
    // ever show.
    const [claiming, setClaiming] = useState(false);

    // Entrance: slide from left. The stagger is capped so a long list doesn't
    // keep the last rows invisible for over a second — past a handful of cards
    // the cascade reads as lag, not as choreography.
    const stagger = Math.min(index, 5) * 70;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceOpacity, {
                toValue: 1,
                duration: 350,
                delay: stagger,
                useNativeDriver: true,
            }),
            Animated.timing(entranceX, {
                toValue: 0,
                duration: 350,
                delay: stagger,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Animate progress bar fill
    useEffect(() => {
        if (item.locked) return;
        Animated.timing(progressAnim, {
            toValue: item.progress / 100,
            duration: 700,
            delay: stagger + 200,
            useNativeDriver: true,
        }).start();
    }, [item.progress]);

    // Runs once the overlay is actually mounted, so the native driver has views
    // to attach to — starting it from the press handler would animate a value
    // nothing was listening to yet.
    useEffect(() => {
        if (!claiming) return;
        claim.setValue(0);
        const anim = Animated.timing(claim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
        });
        anim.start(({finished}) => {
            if (finished) setClaiming(false);
        });
        return () => anim.stop();
    }, [claiming]);

    // Pulse collect button when finished
    useEffect(() => {
        if (!item.finished) return;
        // Stopped on cleanup: this is a list row, so an unstopped loop is one
        // per collectable card, and `item.finished` flips mid-session when a
        // challenge completes.
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(collectPulse, {toValue: 1.08, duration: 600, useNativeDriver: true}),
                Animated.timing(collectPulse, {toValue: 1, duration: 600, useNativeDriver: true}),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [item.finished]);

    // Fire the claim animation and the network call together: the card should
    // feel collected the instant it's tapped, not after the request lands.
    const handleCollect = () => {
        setClaiming(true);
        onCollect?.();
    };

    // Quick punch up, then settle back.
    const claimScale = claim.interpolate({
        inputRange: [0, 0.25, 1],
        outputRange: [1, 1.05, 1],
    });
    // Gold wash that flares and fades out.
    const claimFlashOpacity = claim.interpolate({
        inputRange: [0, 0.18, 1],
        outputRange: [0, 0.35, 0],
    });
    const coinY = claim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -vs(70)],
    });
    const coinScale = claim.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0.6, 1.4, 1],
    });
    const coinOpacity = claim.interpolate({
        inputRange: [0, 0.08, 0.65, 1],
        outputRange: [0, 1, 1, 0],
    });

    const getStatus = () => {
        if (item.locked)    return {label: `🔒 ${t('challengeLocked')}`,   bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)'};
        if (item.taken)     return {label: `✅ ${t('challengeClaimed')}`,   bg: 'rgba(50,205,50,0.2)',  color: LIGHT_GREEN};
        if (item.finished)  return {label: `🎁 ${t('challengeReady')}`,    bg: 'rgba(255,215,0,0.2)',  color: GOLD};
        return               {label: `⚡ ${t('challengeActive')}`,          bg: 'rgba(142,45,226,0.3)', color: '#d4aaff'};
    };

    const getIcon = () => {
        if (item.locked)   return '🔒';
        if (item.taken)    return '✅';
        if (item.finished) return '🎁';
        return '🔥';
    };

    const status = getStatus();

    const cardColors: [string, string] = item.locked
        ? [PURPLE_DARK, DARK_PURPLE]
        : [GRADIENT_LIGHT, GRADIENT_DARK];

    // scaleX off a full-width fill rather than an animated percentage width.
    // A percentage width is a layout prop the native driver can't touch, so this
    // was the one JS-thread animation in a file that is otherwise all-native —
    // and it runs per row in a FlatList, staggered, so the whole visible list
    // was driving layout passes from JS at once. transformOrigin anchors the
    // growth to the left edge without needing to measure the track.
    const progressScale = progressAnim;

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: entranceOpacity,
                    transform: [{translateX: entranceX}, {scale: claimScale}],
                },
            ]}
        >
            <LinearGradient
                pointerEvents="none"
                colors={cardColors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.cardInner}
            />
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Text allowFontScaling={false} style={styles.iconText}>{getIcon()}</Text>
                    </View>

                    <View style={styles.headerText}>
                        <Text allowFontScaling={false} style={styles.title} numberOfLines={1}>{item.title}</Text>
                        {item.locked
                            ? <Text allowFontScaling={false} style={styles.lockedSubtitle}>{t('completePrevious')}</Text>
                            : <Text allowFontScaling={false} style={styles.subtitle}>{t('percentCompleted', {percent: item.progress})}</Text>
                        }
                    </View>

                    <View style={[styles.badge, {backgroundColor: status.bg}]}>
                        <Text allowFontScaling={false} style={[styles.badgeText, {color: status.color}]}>{status.label}</Text>
                    </View>
                </View>

                {/* Progress bar */}
                {!item.locked && (
                    <>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: item.finished ? GOLD : 'rgba(255,255,255,0.85)',
                                        transform: [{scaleX: progressScale}],
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.progressLabel}>
                            <Text allowFontScaling={false} style={styles.progressText}>{t('progress')}</Text>
                            <Text allowFontScaling={false} style={styles.progressText}>
                                {/* Show real counts (2 / 10) when the caller provides them; the
                                    bar itself stays percentage-driven. Falls back to X / 100. */}
                                {typeof item.current === 'number' && typeof item.target === 'number'
                                    ? `${item.current} / ${item.target}`
                                    : `${item.progress} / 100`}
                            </Text>
                        </View>
                    </>
                )}

                {/* Footer */}
                {!item.locked && (
                    <View style={styles.footer}>
                        <View style={styles.rewardRow}>
                            <Coin width={18} height={16}/>
                            <Text allowFontScaling={false} style={styles.rewardText}>{t('coinsReward', {count: item.reward})}</Text>
                        </View>

                        {item.finished && !item.taken && (
                            <Animated.View style={{transform: [{scale: collectPulse}]}}>
                                <TouchableOpacity
                                    style={styles.collectBtn}
                                    activeOpacity={0.8}
                                    onPress={handleCollect}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${t('collect')} ${item.reward}`}
                                >
                                    <Coin width={16} height={14}/>
                                    <Text allowFontScaling={false} style={styles.collectText}>{t('collect')}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {item.taken && (
                            <View style={[styles.badge, {backgroundColor: 'rgba(50,205,50,0.15)'}]}>
                                <Text allowFontScaling={false} style={[styles.badgeText, {color: LIGHT_GREEN}]}>✓ {t('done')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Claim feedback — decorative only, must not intercept taps.
                    Mounted for the ~900ms the animation runs and torn down
                    after, so an idle card carries none of its cost. */}
                {claiming && (
                    <>
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.claimFlash, {opacity: claimFlashOpacity}]}
                        />
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.flyingCoin,
                                {
                                    opacity: coinOpacity,
                                    transform: [{translateY: coinY}, {scale: coinScale}],
                                },
                            ]}
                        >
                            <Coin width={22} height={20}/>
                        </Animated.View>
                    </>
                )}
        </Animated.View>
    );
}

export default ChallengeCard;
