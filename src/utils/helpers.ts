
export function getTrophyEmoji(index: any) {
    switch(index) {
        case 0: return '🥇';
        case 1: return '🥈';
        case 2: return '🥉';
        default: return null;
    }
}