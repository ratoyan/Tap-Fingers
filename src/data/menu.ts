import {MenuType} from "../types/menu.type.ts";

export const menus: MenuType[] = [
    { title: 'play', icon: '▶️', navigateTo: 'Play' },
    { title: 'settings', icon: '⚙️', navigateTo: 'Settings' },
    { title: 'shop', icon: '🛒', navigateTo: 'Shop' },
    { title: 'progression', icon: '🏆', navigateTo: 'Progression' },
    { title: 'challenges', icon: '🎯', navigateTo: 'Challenges' },
];
