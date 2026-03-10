import Sound from "react-native-sound";

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