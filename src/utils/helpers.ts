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

export const playMusic = async () => {
    const cancel = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC)
    if (cancel || !music || isPlaying) return;
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

export const getCoin = async (): Promise<number> => {
    const coin = await AsyncStorage.getItem(STORAGE_KEYS.COIN);
    return coin ? JSON.parse(coin) : 0;
};