import React from 'react';
import {Image, StyleProp, ImageStyle} from 'react-native';
import {LOGO_SIZE} from '../../../constants/uiConstants.ts';

interface LogoProps {
    /** Square size in dp. Omit to use the screen-derived `LOGO_SIZE`. */
    size?: number;
    /** Explicit box, for callers that need a non-square slot. Overrides `size`. */
    width?: number;
    height?: number;
    viewStyles?: StyleProp<ImageStyle>;
}

function Logo({size, width, height, viewStyles}: LogoProps) {
    const w = width ?? size ?? LOGO_SIZE;
    const h = height ?? size ?? LOGO_SIZE;

    return (
        <Image
            source={require('../../../assets/images/logo.png')}
            style={[{width: w, height: h}, viewStyles]}
            // 'contain', not 'stretch' — callers that hand over a non-square box
            // (Welcome sizes width and height off different axes) were squashing
            // the square artwork by ~14% instead of just letterboxing it.
            resizeMode="contain"
        />
    );
}

export default Logo;
