import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';

interface LogoProps {
    width: number;
    height: number;
    viewStyles?: StyleProp<ImageStyle>; // ճիշտ type
}

function Logo({ width, height, viewStyles }: LogoProps) {
    return (
        <Image
            source={require('../../../assets/images/logo.png')}
            style={[{ width, height }, viewStyles]} // combine default + custom styles
            resizeMode="stretch"
        />
    );
}

export default Logo;