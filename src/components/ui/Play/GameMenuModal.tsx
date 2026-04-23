import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {ms, vs} from '../../../utils/responsive.ts';
import {GRADIENT_DARK, GRADIENT_LIGHT, WHITE} from '../../../constants/colors.ts';

// icons
import ExitIcon from '../../../assets/icons/ExitIcon.tsx';
import PlayIcon from '../../../assets/icons/PlayIcon.tsx';

// components
import SettingsModal from './SettingsModal.tsx';

interface GameMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onExit: () => void;
}

export default function GameMenuModal({visible, onClose, onExit}: GameMenuModalProps) {
    const {t} = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const [settingsVisible, setSettingsVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0);
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <>
            <View style={styles.overlay}>
                <Animated.View style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>

                    {/* Resume */}
                    <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.btn}>
                        <LinearGradient
                            colors={[GRADIENT_LIGHT, GRADIENT_DARK]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.btnGradient}
                        >
                            <PlayIcon size={18} color={WHITE} />
                            <Text style={styles.resumeText}>{t('play')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Settings */}
                    <TouchableOpacity
                        onPress={() => setSettingsVisible(true)}
                        activeOpacity={0.85}
                        style={[styles.btn, styles.settingsBtn]}
                    >
                        <Text style={styles.settingsText}>⚙️  {t('settings')}</Text>
                    </TouchableOpacity>

                    {/* Exit Game */}
                    <TouchableOpacity onPress={onExit} activeOpacity={0.85} style={styles.exitBtnWrapper}>
                        <LinearGradient
                            colors={['#3a0060', '#6a0dad']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.exitGradient}
                        >
                            <ExitIcon size={18} color="#DDA0DD" />
                            <Text style={styles.exitText}>{t('exitGame')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </Animated.View>
            </View>

            <SettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    modal: {
        width: '84%',
        backgroundColor: '#1a0030',
        borderRadius: ms(22),
        borderWidth: 1.5,
        borderColor: '#8e2de2',
        paddingHorizontal: ms(20),
        paddingTop: ms(22),
        paddingBottom: ms(20),
        alignItems: 'center',
        gap: ms(12),
        shadowColor: '#8e2de2',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 20,
    },
    btn: {
        width: '100%',
    },
    btnGradient: {
        borderRadius: ms(14),
        paddingVertical: vs(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
    },
    resumeText: {
        color: WHITE,
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    settingsBtn: {
        backgroundColor: 'rgba(142,45,226,0.18)',
        borderRadius: ms(14),
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.25)',
        paddingVertical: vs(14),
        alignItems: 'center',
    },
    settingsText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    exitBtnWrapper: {
        width: '100%',
        borderRadius: ms(14),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(221,160,221,0.3)',
    },
    exitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ms(8),
        paddingVertical: vs(13),
    },
    exitText: {
        color: '#DDA0DD',
        fontSize: ms(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
