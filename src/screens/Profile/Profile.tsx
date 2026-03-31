import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import {useTranslation} from "react-i18next";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";

// styles
import styles from './Profile.style.ts'
import {GRADIENT_LIGHT, PURPLE, VIOLET} from "../../constants/colors.ts";
import LinearGradient from 'react-native-linear-gradient';

function Profile() {
    const [username, setUsername] = useState('Your Name');
    const {t} = useTranslation();

    return (
        <LinearGradient
            colors={[GRADIENT_LIGHT, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Profile screen"
        >
            <BackHeader title={`👨‍🎓 ${t('profile')}`}/>

            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false} // prevent blocking inner elements
            >
                <View style={styles.scrollContainer}>

                    {/* Profile Image */}
                    <View
                        style={styles.avatarWrapper}
                        accessible={true}
                        accessibilityRole="image"
                        accessibilityLabel="User profile picture"
                    >
                        <Image
                            source={{uri: 'https://i.pravatar.cc/150?img=3'}}
                            style={styles.avatar}
                        />
                    </View>

                    {/* Username Input */}
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={VIOLET}
                        accessible={true}
                        accessibilityLabel="Username input field"
                        accessibilityHint="Enter your name here"
                        accessibilityRole="text"
                        returnKeyType="done"
                    />

                    {/* Greeting Text */}
                    <Text
                        style={styles.greeting}
                        accessible={true}
                        accessibilityRole="text"
                        accessibilityLabel={`Greeting text. Hello ${username}`}
                    >
                        Hello, {username}!
                    </Text>

                </View>
            </TouchableWithoutFeedback>
        </LinearGradient>
    );
}

export default Profile;