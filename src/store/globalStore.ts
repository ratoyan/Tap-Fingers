import {create} from 'zustand';

interface GlobalState {
    coins: number;
    addCoins: (amount: number) => void;
    minusCoins: (amount: number) => void;
    setCoins: (value: number) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    coins: 0,
    addCoins: (amount: number) =>
        set((state) => ({
            coins: state.coins + amount,
        })),

    minusCoins: (amount: number) =>
        set((state) => ({
            coins: state.coins - amount,
        })),

    setCoins: (value: number) =>
        set({
            coins: value,
        }),
}));