import {create} from 'zustand';
import {ShopEntry} from '../data/shopVisuals';

// Holds the currently-equipped card + background as resolved ShopEntry objects
// (backend key + on-device visual). Populated from the server profile's
// activeCardKey / activeBackgroundKey by the auth store, and updated optimistically
// when the player equips something in the Shop.
interface ShopState {
    card: ShopEntry | null;
    background: ShopEntry | null;
    setCard: (card: ShopEntry | null) => void;
    setBackground: (background: ShopEntry | null) => void;
}

export const useShopStore = create<ShopState>((set) => ({
    card: null,
    background: null,

    setCard: (value) =>
        set({
            card: value,
        }),

    setBackground: (value) =>
        set({
            background: value,
        }),
}));
