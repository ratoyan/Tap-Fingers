import {create} from 'zustand';

interface ShopState {
    card: any,
    background: any,
    setCard: (card: any) => void;
    setBackground: (background: any) => void;
}

export const useShopStore = create<ShopState>((set) => ({
    card: null,
    background: null,

    setCard: (value: number) =>
        set({
            card: value,
        }),

    setBackground: (value: number) =>
        set({
            background: value,
        }),
}));