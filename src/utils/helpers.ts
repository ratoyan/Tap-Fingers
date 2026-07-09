import Sound from "react-native-sound";
import {storage} from "../db/kvStore.ts";
import {STORAGE_KEYS} from "./storageKeys.ts";

let music: Sound | null = null;
let isPlaying = false;

// Gives a brand-new player one of each gameplay helper (bomb / slow / shield).
// Idempotent: a no-op once the counts have been written, so it's safe to call
// from every entry point (Welcome's guest button and the auto-guest bootstrap).
export async function seedHelperDefaults(): Promise<void> {
    try {
        const existing = await storage.getItem(STORAGE_KEYS.BOMB_COUNT);
        if (existing != null) return;
        await storage.multiSet([
            [STORAGE_KEYS.BOMB_COUNT, JSON.stringify(1)],
            [STORAGE_KEYS.SLOW_COUNT, JSON.stringify(1)],
            [STORAGE_KEYS.SHIELD_COUNT, JSON.stringify(1)],
        ]);
    } catch (error) {
        console.log('Seed error:', error);
    }
}

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
    const cancel = await storage.getItem(STORAGE_KEYS.MUSIC)
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