// ── Random user avatars ─────────────────────────────────────────────────────
// A curated set of fun avatars shown when a player hasn't uploaded a photo.
// Each account is assigned one deterministically from its id (see avatarForId),
// so the "random" pick is made implicitly at registration and stays stable
// across sessions and devices — no extra storage or backend field needed.

export interface AvatarOption {
    emoji: string;
    colors: [string, string]; // gradient background
}

export const AVATARS: AvatarOption[] = [
    {emoji: '🦊', colors: ['#FF9A56', '#FF6A88']},
    {emoji: '🐱', colors: ['#A18CD1', '#FBC2EB']},
    {emoji: '🐼', colors: ['#84FAB0', '#8FD3F4']},
    {emoji: '🦁', colors: ['#F6D365', '#FDA085']},
    {emoji: '🐸', colors: ['#96E6A1', '#43C6AC']},
    {emoji: '🦄', colors: ['#A1C4FD', '#C2E9FB']},
    {emoji: '🐯', colors: ['#FBAB7E', '#F7CE68']},
    {emoji: '🐧', colors: ['#5EE7DF', '#B490CA']},
    {emoji: '🐵', colors: ['#FDCB82', '#E8A87C']},
    {emoji: '🐨', colors: ['#9FA5D5', '#E8F5C8']},
    {emoji: '🦉', colors: ['#FFD3A5', '#FD6585']},
    {emoji: '🐙', colors: ['#FF6A88', '#FF99AC']},
    {emoji: '🐢', colors: ['#56AB2F', '#A8E063']},
    {emoji: '🐳', colors: ['#4FACFE', '#00F2FE']},
    {emoji: '🦋', colors: ['#C471F5', '#FA71CD']},
    {emoji: '🐝', colors: ['#F7971E', '#FFD200']},
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
