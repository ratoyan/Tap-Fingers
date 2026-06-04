// ── Random user avatars ─────────────────────────────────────────────────────
// A curated set of fun avatars shown when a player hasn't uploaded a photo.
// Each account is assigned one deterministically from its id (see avatarForId),
// so the "random" pick is made implicitly at registration and stays stable
// across sessions and devices — no extra storage or backend field needed.

export interface AvatarOption {
    emoji: string;
    colors: [string, string]; // gradient background
}

// Game-themed avatars — the things players actually tap, dodge and chase in
// TapFingers (balloons, bombs, stars, hearts, bosses…), each on a gradient
// that matches the icon's vibe.
export const AVATARS: AvatarOption[] = [
    {emoji: '👆', colors: ['#8E2DE2', '#4A00E0']}, // the tap itself
    {emoji: '🎈', colors: ['#FF6A88', '#FF99AC']}, // balloon
    {emoji: '💣', colors: ['#3A3A3A', '#FF6A00']}, // bomb
    {emoji: '⭐', colors: ['#F7971E', '#FFD200']}, // star
    {emoji: '💎', colors: ['#4FACFE', '#00F2FE']}, // diamond
    {emoji: '❤️', colors: ['#FF512F', '#DD2476']}, // heart
    {emoji: '👻', colors: ['#A18CD1', '#FBC2EB']}, // ghost
    {emoji: '🔥', colors: ['#FF512F', '#F09819']}, // flame
    {emoji: '⚡', colors: ['#F6D365', '#FDA085']}, // bolt
    {emoji: '🎯', colors: ['#FF5858', '#FB2576']}, // target
    {emoji: '🏆', colors: ['#FBAB7E', '#F7CE68']}, // trophy
    {emoji: '👑', colors: ['#FFD200', '#F7971E']}, // crown
    {emoji: '🚀', colors: ['#667EEA', '#764BA2']}, // rocket
    {emoji: '💥', colors: ['#F12711', '#F5AF19']}, // boom
    {emoji: '🃏', colors: ['#C471F5', '#FA71CD']}, // card
    {emoji: '🎮', colors: ['#43C6AC', '#191654']}, // controller
];

// Stable, evenly-distributed pick from the player's id (UUID/string).
export function avatarForId(id?: string | null): AvatarOption {
    if (!id) return AVATARS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return AVATARS[hash % AVATARS.length];
}
