import React, {useEffect, useRef, useState} from "react";
import {Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {SvgXml} from "react-native-svg";

// icons
import Coin from "../../../assets/icons/Coin.tsx";
import Ballon from "../../../assets/icons/Ballon.tsx";
import Card1 from "../../../assets/icons/Card1.tsx";
import StarCard from "../../../assets/icons/StarCard.tsx";
import DiamondCard from "../../../assets/icons/DiamondCard.tsx";
import HeartCard from "../../../assets/icons/HeartCard.tsx";
import BombCard from "../../../assets/icons/BombCard.tsx";
import Ghost from "../../../assets/icons/Ghost.tsx";
import FlameIcon from "../../../assets/icons/FlameIcon.tsx";
import BoltIcon from "../../../assets/icons/BoltIcon.tsx";
import SuccessIcon from "../../../assets/icons/SuccessIcon.tsx";

// styles
import styles from './ShopItem.style.ts';
import {DARK_PURPLE, GRADIENT_DARK, GRADIENT_LIGHT, MEDIUM_PURPLE, PURPLE_DARK} from "../../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

interface ShopItemProps {
    item: any;
    index?: number;
    handlePress?: () => void;
    selected?: boolean;
    purchased?: boolean;
    disabled?: boolean;
}

function ShopItem({item, index = 0, handlePress, selected = false, purchased = false, disabled = false}: ShopItemProps) {

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const entranceOpacity = useRef(new Animated.Value(0)).current;
    const entranceY = useRef(new Animated.Value(30)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const badgeSpin = useRef(new Animated.Value(0)).current;
    const badgePulse = useRef(new Animated.Value(0)).current;
    const shineAnim = useRef(new Animated.Value(0)).current;   // sweeping gloss
    const floatAnim = useRef(new Animated.Value(0)).current;   // idle preview bob
    const isFirstRender = useRef(true);

    // Measured card width, so the shine can travel exactly edge-to-edge.
    const [cardWidth, setCardWidth] = useState(0);

    const isBackground = item.typeName === 'background';

    // Random-colors badge: a slowly sweeping rainbow disc with a gentle pulse,
    // so the indicator feels alive and signals "colourful" at a glance.
    useEffect(() => {
        if (!item.randomColors) return;
        const spin = Animated.loop(
            Animated.timing(badgeSpin, {toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true}),
        );
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(badgePulse, {toValue: 1, duration: 1100, useNativeDriver: true}),
                Animated.timing(badgePulse, {toValue: 0, duration: 1100, useNativeDriver: true}),
            ]),
        );
        spin.start();
        pulse.start();
        return () => { spin.stop(); pulse.stop(); };
    }, [item.randomColors]);

    // Staggered entrance
    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceOpacity, {
                toValue: 1,
                duration: 350,
                delay: index * 70,
                useNativeDriver: true,
            }),
            Animated.timing(entranceY, {
                toValue: 0,
                duration: 350,
                delay: index * 70,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Glow pulse when selected
    useEffect(() => {
        if (!selected) {
            glowAnim.setValue(0);
            return;
        }
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {toValue: 1, duration: 900, useNativeDriver: false}),
                Animated.timing(glowAnim, {toValue: 0.3, duration: 900, useNativeDriver: false}),
            ])
        ).start();
    }, [selected]);

    // Bounce on select
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!selected) return;
        Animated.sequence([
            Animated.spring(scaleAnim, {toValue: 1.08, friction: 3, tension: 120, useNativeDriver: true}),
            Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 80, useNativeDriver: true}),
        ]).start();
    }, [selected]);

    // Glossy shine that sweeps across the card on a gentle, staggered loop.
    useEffect(() => {
        if (cardWidth === 0) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(1600 + (index % 6) * 260),
                Animated.timing(shineAnim, {toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
                Animated.timing(shineAnim, {toValue: 0, duration: 0, useNativeDriver: true}),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [cardWidth, index]);

    // Idle float — the card preview gently bobs (skip for full-bleed backgrounds,
    // where shifting the image would expose an edge).
    useEffect(() => {
        if (isBackground) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
                Animated.timing(floatAnim, {toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
            ]),
        );
        const t = setTimeout(() => loop.start(), (index % 6) * 120);
        return () => { clearTimeout(t); loop.stop(); };
    }, [isBackground, index]);

    function onPressIn() {
        Animated.spring(scaleAnim, {toValue: 0.93, friction: 8, useNativeDriver: true}).start();
    }

    function onPressOut() {
        Animated.spring(scaleAnim, {toValue: 1, friction: 5, useNativeDriver: true}).start();
    }

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(142,45,226,0.4)', 'rgba(142,45,226,1)'],
    });

    const badgeRotate = badgeSpin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
    const badgeScale = badgePulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.12]});

    // Shine travels from just off the left edge to just off the right edge, and
    // is only visible mid-sweep (fades in then out).
    const shineTranslate = shineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-cardWidth * 0.6, cardWidth * 1.1],
    });
    const shineOpacity = shineAnim.interpolate({
        inputRange: [0, 0.15, 0.85, 1],
        outputRange: [0, 0.5, 0.5, 0],
    });
    const floatY = floatAnim.interpolate({inputRange: [0, 1], outputRange: [0, -5]});

    // State-tinted card border: green when equipped, gold when owned, purple
    // otherwise — a quick at-a-glance signal of the item's status.
    const cardBorderColor = DARK_PURPLE;

    const renderPreview = () => {
        // Admin-authored SVG (backend) wins for cards — falls back to the
        // on-device component below when the catalog item has no icon_svg.
        if (item.type === 'card' && typeof item.iconSvg === 'string' && item.iconSvg.trim()) {
            return <SvgXml xml={item.iconSvg} width={96} height={96}/>;
        }
        switch (item.typeName) {
            case 'ballon':
                return <Ballon width={110} height={110}/>;
            case 'card':
                return <Card1 width={90} height={90}/>;
            case 'star':
                return <StarCard width={90} height={90}/>;
            case 'diamond':
                return <DiamondCard width={90} height={90}/>;
            case 'heart':
                return <HeartCard width={90} height={90}/>;
            case 'bomb':
                return <BombCard width={90} height={90}/>;
            case 'ghost':
                return <Ghost size={90}/>;
            case 'square':
                return (
                    <View style={styles.squareGrid}>
                        {['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'].map((color, i) => (
                            <View key={i} style={[styles.squareItem, {backgroundColor: color}]}/>
                        ))}
                    </View>
                );
            case 'background':
                if (item.animationType === 'stars') {
                    return (
                        <LinearGradient colors={['#020012', '#090040']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text allowFontScaling={false} style={{fontSize: 32}}>✨</Text>
                            <Text allowFontScaling={false} style={{color: '#aaaaff', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'aurora') {
                    return (
                        <LinearGradient colors={['#010008', '#0d2040', '#1a0030']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text allowFontScaling={false} style={{fontSize: 32}}>🌌</Text>
                            <Text allowFontScaling={false} style={{color: '#80ffb0', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'inferno') {
                    return (
                        <LinearGradient colors={['#0d0000', '#4d0000', '#ff3300']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text allowFontScaling={false} style={{fontSize: 32}}>🔥</Text>
                            <Text allowFontScaling={false} style={{color: '#ffaa44', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'matrix') {
                    return (
                        <LinearGradient colors={['#000900', '#001a00']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text allowFontScaling={false} style={{fontSize: 32}}>💚</Text>
                            <Text allowFontScaling={false} style={{color: '#00ff41', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.images?.length) {
                    return (
                        <Image
                            source={item.images[0]}
                            style={{width: '100%', height: '100%'}}
                            resizeMode="cover"
                        />
                    );
                }
                if (item.colors?.length) {
                    return <View style={{width: '100%', height: '100%', backgroundColor: item.colors[0]}}/>;
                }
                return null;
            default:
                return null;
        }
    };

    const renderBadge = () => {
        if (selected) {
            return (
                <View style={styles.equippedBadge}>
                    <Text allowFontScaling={false} style={styles.equippedText}>✓ Equipped</Text>
                </View>
            );
        }
        if (purchased) {
            return (
                <View style={styles.ownedBadge}>
                    <Text allowFontScaling={false} style={styles.ownedText}>Tap to equip</Text>
                </View>
            );
        }
        return (
            <LinearGradient
                colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.priceBadge}
            >
                <Text allowFontScaling={false} style={styles.priceText}>{item.coins}</Text>
                <Coin width={18} height={16}/>
            </LinearGradient>
        );
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    opacity: entranceOpacity,
                    transform: [{translateY: entranceY}, {scale: scaleAnim}],
                },
            ]}
        >
            {/* Glow border for selected */}
            {selected && (
                <Animated.View style={[styles.selectedBorder, {borderColor: glowColor}]}/>
            )}

            <TouchableOpacity
                onPress={handlePress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                disabled={disabled}
            >
                <LinearGradient
                    colors={['#3a0b5e', PURPLE_DARK, DARK_PURPLE]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.card, {borderColor: cardBorderColor}]}
                    onLayout={e => setCardWidth(e.nativeEvent.layout.width)}
                >
                    {/* Preview */}
                    <View style={[
                        styles.preview,
                        !isBackground && {paddingVertical: 10},
                    ]}>
                        {/* Soft coloured backdrop behind card icons (hidden under
                            full-bleed background previews, which paint over it). */}
                        {!isBackground && (
                            <LinearGradient
                                colors={['rgba(142,45,226,0.22)', 'rgba(0,0,0,0)']}
                                start={{x: 0.5, y: 0}}
                                end={{x: 0.5, y: 1}}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                        )}
                        {/* Card icons gently float; full-bleed backgrounds render
                            directly so their 100%-height fill still resolves. */}
                        {isBackground ? renderPreview() : (
                            <Animated.View style={{transform: [{translateY: floatY}]}}>
                                {renderPreview()}
                            </Animated.View>
                        )}
                        {/* Glossy sheen along the top edge. */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                            style={styles.previewSheen}
                            pointerEvents="none"
                        />
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text allowFontScaling={false} style={styles.title} numberOfLines={1}>{item.title}</Text>
                        {renderBadge()}
                    </View>

                    {/* Sweeping shine across the whole card. */}
                    {cardWidth > 0 && (
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.shine, {opacity: shineOpacity, transform: [{translateX: shineTranslate}, {skewX: '-18deg'}]}]}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={{flex: 1}}
                            />
                        </Animated.View>
                    )}
                </LinearGradient>

                {/* Random-colors indicator (top-left) — falling cards of this
                    skin render in random colours in Play. */}
                {item.randomColors && (
                    <Animated.View style={[styles.randomBadge, {transform: [{scale: badgeScale}]}]}>
                        <Animated.View style={[styles.randomBadgeGradientWrap, {transform: [{rotate: badgeRotate}]}]}>
                            <LinearGradient
                                colors={['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB', '#FF5252']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.randomBadgeGradient}
                            />
                        </Animated.View>
                        <Text allowFontScaling={false} style={styles.randomBadgeText}>🎨</Text>
                    </Animated.View>
                )}

                {/* Lock overlay */}
                {disabled && (
                    <View style={styles.lockOverlay}>
                        <Text allowFontScaling={false} style={styles.lockText}>🔒</Text>
                        <Text allowFontScaling={false} style={styles.lockPrice}>{item.coins} coins needed</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Equipped checkmark */}
            {selected && (
                <View style={{position: 'absolute', top: -8, right: -6, zIndex: 10}}>
                    <SuccessIcon width={34} height={34}/>
                </View>
            )}
        </Animated.View>
    );
}

export default ShopItem;
