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

export const pauceMusic = () => {
    if (!music || !isPlaying) return;

    music.pause();
    isPlaying = false;
};

// Coins, equipped card and background are now server-authoritative — see
// authStore (hydrated from /player/profile) and shopVisuals.ts. The old
// AsyncStorage-backed getCoin/getCard/getBackground helpers were removed.