import Sound from "react-native-sound";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {STORAGE_KEYS} from "./storageKeys.ts";

let music: Sound | null = null;
let isPlaying = false;

export function getTrophyEmoji(index: any) {
    switch (index) {
        case 0:
            return '🥇';
        case 1:
            return '🥈';
        case 2:
            return '🥉';
        default:
            return null;
    }
}

export const loadMusic = (filename: string) => {
    if (music) return;

    music = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log("failed to load music", error);
            music = null;
            return;
        }
        // @ts-ignore
        music.setNumberOfLoops(-1);
        console.log("Music loaded");
    });
};

export const playMusic = () => {
    if (!music || isPlaying) return;
    music.play((success) => {
        if (!success) console.log("playback failed");
    });
    isPlaying = true;
};

export const releaseMusic = () => {
    music?.stop();
    music?.release();
    music = null;
    isPlaying = false;
};

export const stopMusic = () => {
    if (!music || !isPlaying) return;

    music.stop();
    isPlaying = false;
};

export const setStorageSettings = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(true));
    await AsyncStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(true));
    await AsyncStorage.setItem(STORAGE_KEYS.VIBRATION, JSON.stringify(true));
}

export const removeStorageSettings = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.MUSIC);
    await AsyncStorage.removeItem(STORAGE_KEYS.SOUND);
    await AsyncStorage.removeItem(STORAGE_KEYS.VIBRATION);
}