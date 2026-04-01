import React, {useRef, useEffect} from 'react';
import {Text, TouchableOpacity, Animated, Dimensions} from 'react-native';
import {useNavigation} from "@react-navigation/core";

// icons
import GoogleLogo from "../../assets/icons/GoogleLogo.tsx";
import AppleLogo from "../../assets/icons/AppleLogo.tsx";

// components
import Logo from "../../components/ui/Logo/Logo.tsx";

// styles
import styles from './Welcome.style.ts';
import {DARK_PURPLE, MEDIUM_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

function Welcome() {
    const navigation = useNavigation<any>();

    // Animation refs
    const fadeTitle = useRef(new Animated.Value(0)).current;
    const slideButtons = useRef(new Animated.Value(50)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate title
        Animated.timing(fadeTitle, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Animate buttons (slide up + fade in)
        Animated.timing(slideButtons, {
            toValue: 0,
            duration: 800,
            delay: 300, // small delay after title
            useNativeDriver: true,
        }).start();

        // Infinite up-down float
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15,      // move up
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,        // back to center
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 15,       // move down
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,        // back to center
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE, MEDIUM_PURPLE]}
            style={styles.container}
        >
            <Animated.Text
                style={[
                    styles.title,
                    {width: '50%', textAlign: 'center'},
                    {
                        opacity: fadeTitle, transform: [{
                            translateY: fadeTitle.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }]
                    }
                ]}
            >
                Tap Fingers
            </Animated.Text>
            <Animated.View
                style={{
                    transform: [{translateY: floatAnim}],
                    height: Dimensions.get('window').height / 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Logo
                    width={Dimensions.get('window').width / 1.5}
                    height={Dimensions.get('window').height / 2.6}
                />
            </Animated.View>

            {/* Google Sign In */}
            <Animated.View style={{
                transform: [{translateY: slideButtons}],
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: slideButtons.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0]
                })
            }}>
                <TouchableOpacity style={styles.button} onPress={()=>{
                    navigation.navigate('Home')
                }}>
                    <LinearGradient
                        colors={['#FF5F6D', '#FFC371']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.gradientButton}
                    >
                        <GoogleLogo/>
                        <Text style={styles.buttonTextLarge}>Sign in with Google</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Apple Sign In */}
            <Animated.View style={{
                transform: [{translateY: slideButtons}], width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: slideButtons.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0]
                })
            }}>
                <TouchableOpacity style={styles.button} onPress={()=>{
                    navigation.navigate('Home')
                }}>
                    <LinearGradient
                        colors={['#333', '#000']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={[styles.gradientButton, {paddingBottom: 20}]}
                    >
                        <AppleLogo/>
                        <Text style={[styles.buttonTextLarge, {marginBottom: -5}]}>Sign in with Apple</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </LinearGradient>
    );
}

export default Welcome;