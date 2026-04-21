import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, Easing, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');
export const BOSS_SIZE = 150;

interface Props {
    bossHP:    number;
    bossMaxHP: number;
    level:     number;
    onTap:     () => void;
}

export default function BossBox({bossHP, bossMaxHP, level, onTap}: Props) {
    const posX        = useRef(new Animated.Value(width / 2 - BOSS_SIZE / 2)).current;
    const posY        = useRef(new Animated.Value(height / 2 - BOSS_SIZE / 2)).current;
    const scaleAnim   = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.3)).current;
    const hitOpacity  = useRef(new Animated.Value(0)).current;
    const moveRef     = useRef<Animated.CompositeAnimation | null>(null);

    const hpRatio = bossMaxHP > 0 ? bossHP / bossMaxHP : 0;
    const hpColor = hpRatio > 0.6 ? '#2ecc71' : hpRatio > 0.3 ? '#f39c12' : '#e74c3c';
    const moveDur = Math.max(480, 1500 - Math.floor((level - 1) / 10) * 150);

    useEffect(() => {
        Animated.spring(scaleAnim, {toValue: 1, friction: 5, tension: 55, useNativeDriver: true}).start(() => {
            moveToNext();
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, {toValue: 1,   duration: 650, useNativeDriver: true}),
                Animated.timing(glowOpacity, {toValue: 0.2, duration: 650, useNativeDriver: true}),
            ])
        ).start();

        return () => moveRef.current?.stop();
    }, []);

    function moveToNext() {
        const nx = 20  + Math.random() * (width  - BOSS_SIZE - 40);
        const ny = 130 + Math.random() * (height * 0.52 - BOSS_SIZE);
        moveRef.current = Animated.parallel([
            Animated.timing(posX, {toValue: nx, duration: moveDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
            Animated.timing(posY, {toValue: ny, duration: moveDur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]);
        moveRef.current.start(({finished}: {finished: boolean}) => {
            if (finished) moveToNext();
        });
    }

    function handleTap() {
        hitOpacity.setValue(0.8);
        Animated.timing(hitOpacity, {toValue: 0, duration: 200, useNativeDriver: true}).start();
        Animated.sequence([
            Animated.timing(scaleAnim, {toValue: 0.82, duration: 65,  useNativeDriver: true}),
            Animated.spring( scaleAnim, {toValue: 1,    friction: 4, tension: 120, useNativeDriver: true}),
        ]).start();
        onTap();
    }

    return (
        <Animated.View
            style={{
                position:   'absolute',
                zIndex:     12,
                alignItems: 'center',
                transform:  [{translateX: posX}, {translateY: posY}, {scale: scaleAnim}],
            }}
        >
            {/* HP bar */}
            <View style={{width: BOSS_SIZE + 20, marginBottom: 6}}>
                <Text style={{
                    color:       '#fff',
                    fontSize:    11,
                    fontWeight:  '900',
                    letterSpacing: 1,
                    textAlign:   'center',
                    marginBottom: 4,
                    textShadowColor: '#000',
                    textShadowRadius: 6,
                }}>
                    ☠️  {bossHP} / {bossMaxHP}
                </Text>
                <View style={{
                    width:           '100%',
                    height:          8,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    borderRadius:    4,
                    overflow:        'hidden',
                    borderWidth:     1,
                    borderColor:     'rgba(255,255,255,0.25)',
                }}>
                    <View style={{
                        width:           `${Math.round(hpRatio * 100)}%`,
                        height:          '100%',
                        backgroundColor: hpColor,
                        borderRadius:    4,
                    }}/>
                </View>
            </View>

            {/* Glow ring behind boss */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position:        'absolute',
                    bottom:          -10,
                    left:            -10,
                    width:           BOSS_SIZE + 20,
                    height:          BOSS_SIZE + 20,
                    borderRadius:    (BOSS_SIZE + 20) / 2,
                    backgroundColor: 'rgba(220,0,50,0.55)',
                    opacity:         glowOpacity,
                }}
            />

            {/* Boss body */}
            <TouchableOpacity onPress={handleTap} activeOpacity={0.95}>
                <LinearGradient
                    colors={['#3d0066', '#8b0020', '#3d0066']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={{
                        width:          BOSS_SIZE,
                        height:         BOSS_SIZE,
                        borderRadius:   BOSS_SIZE / 2,
                        alignItems:     'center',
                        justifyContent: 'center',
                        borderWidth:    3,
                        borderColor:    'rgba(255,80,80,0.85)',
                    }}
                >
                    <Text style={{fontSize: 72, lineHeight: 84}}>👾</Text>

                    {/* Hit flash */}
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position:        'absolute',
                            width:           '100%',
                            height:          '100%',
                            borderRadius:    BOSS_SIZE / 2,
                            backgroundColor: '#ff0000',
                            opacity:         hitOpacity,
                        }}
                    />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}
