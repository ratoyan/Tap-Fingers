import React, {useEffect, useRef} from "react";
import {Animated, Image, Text, TouchableOpacity, View} from "react-native";

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
    const isFirstRender = useRef(true);

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

    const renderPreview = () => {
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
                            <Text style={{fontSize: 32}}>✨</Text>
                            <Text style={{color: '#aaaaff', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'aurora') {
                    return (
                        <LinearGradient colors={['#010008', '#0d2040', '#1a0030']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text style={{fontSize: 32}}>🌌</Text>
                            <Text style={{color: '#80ffb0', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'inferno') {
                    return (
                        <LinearGradient colors={['#0d0000', '#4d0000', '#ff3300']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text style={{fontSize: 32}}>🔥</Text>
                            <Text style={{color: '#ffaa44', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
                        </LinearGradient>
                    );
                }
                if (item.animationType === 'matrix') {
                    return (
                        <LinearGradient colors={['#000900', '#001a00']} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            <Text style={{fontSize: 32}}>💚</Text>
                            <Text style={{color: '#00ff41', fontSize: 10, marginTop: 4}}>ANIMATED</Text>
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
                    <Text style={styles.equippedText}>✓ Equipped</Text>
                </View>
            );
        }
        if (purchased) {
            return (
                <View style={styles.ownedBadge}>
                    <Text style={styles.ownedText}>Tap to equip</Text>
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
                <Text style={styles.priceText}>{item.coins}</Text>
                <Coin width={18} height={16}/>
            </LinearGradient>
        );
    };

    const isBackground = item.typeName === 'background';

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
                    colors={[PURPLE_DARK, DARK_PURPLE]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.card}
                >
                    {/* Preview */}
                    <View style={[
                        styles.preview,
                        !isBackground && {paddingVertical: 10},
                    ]}>
                        {renderPreview()}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        {renderBadge()}
                    </View>
                </LinearGradient>

                {/* Lock overlay */}
                {disabled && (
                    <View style={styles.lockOverlay}>
                        <Text style={styles.lockText}>🔒</Text>
                        <Text style={styles.lockPrice}>{item.coins} coins needed</Text>
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
