import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// components
import BackHeader from '../../components/ui/BackHeader/BackHeader.tsx';
import PhotoPickerSheet from '../../components/ui/PhotoPickerSheet/PhotoPickerSheet.tsx';

// styles
import styles from './Profile.style.ts';
import {GRADIENT_LIGHT, PURPLE, VIOLET} from '../../constants/colors.ts';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=3';
const STORAGE_KEY_NAME = 'profile_username';
const STORAGE_KEY_PHOTO = 'profile_photo';

function Profile() {
    const [username, setUsername] = useState('Your Name');
    const [photoUri, setPhotoUri] = useState<string>(DEFAULT_AVATAR);
    const [sheetVisible, setSheetVisible] = useState(false);
    const {t} = useTranslation();

    useEffect(() => {
        (async () => {
            const [savedName, savedPhoto] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY_NAME),
                AsyncStorage.getItem(STORAGE_KEY_PHOTO),
            ]);
            if (savedName) setUsername(savedName);
            if (savedPhoto) setPhotoUri(savedPhoto);
        })();
    }, []);

    async function handleNameChange(value: string) {
        setUsername(value);
        await AsyncStorage.setItem(STORAGE_KEY_NAME, value);
    }

    async function handlePickResult(uri: string) {
        setPhotoUri(uri);
        await AsyncStorage.setItem(STORAGE_KEY_PHOTO, uri);
        setSheetVisible(false);
    }

    function handleCamera() {
        launchCamera({mediaType: 'photo', quality: 0.8}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) handlePickResult(uri);
        });
    }

    function handleGallery() {
        launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}, response => {
            const uri = response.assets?.[0]?.uri;
            if (uri) handlePickResult(uri);
        });
    }

    return (
        <LinearGradient
            colors={[GRADIENT_LIGHT, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Profile screen"
        >
            <BackHeader title={`👨‍🎓 ${t('profile')}`} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.scrollContainer}>

                    {/* Avatar + change button */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            onPress={() => setSheetVisible(true)}
                            activeOpacity={0.85}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t('changePhoto')}
                        >
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{uri: photoUri}}
                                    style={styles.avatar}
                                    accessible={true}
                                    accessibilityRole="image"
                                    accessibilityLabel="User profile picture"
                                />
                                <View style={styles.cameraOverlay}>
                                    <Text style={styles.cameraIcon}>📷</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changePhotoText}>{t('changePhoto')}</Text>
                    </View>

                    {/* Greeting */}
                    <Text
                        style={styles.greeting}
                        accessible={true}
                        accessibilityRole="text"
                    >
                        Hello, {username}!
                    </Text>

                    {/* Name input card */}
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>✏️  Name</Text>
                        <TextInput
                            value={username}
                            onChangeText={handleNameChange}
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor={VIOLET}
                            accessible={true}
                            accessibilityLabel="Username input field"
                            accessibilityRole="text"
                            returnKeyType="done"
                        />
                    </View>

                </View>
            </TouchableWithoutFeedback>

            <PhotoPickerSheet
                visible={sheetVisible}
                onCamera={handleCamera}
                onGallery={handleGallery}
                onClose={() => setSheetVisible(false)}
            />
        </LinearGradient>
    );
}

export default Profile;
