import {create} from 'zustand';

// Coins/gems mirror the server-authoritative PlayerStats. The mutating helpers
// (addCoins/minusCoins) are optimistic — the next profile refresh or API
// response (game end, purchase, challenge claim) reconciles them with the
// backend via setCoins/setGems.
interface GlobalState {
    coins: number;
    gems: number;
    addCoins: (amount: number) => void;
    minusCoins: (amount: number) => void;
    setCoins: (value: number) => void;
    setGems: (value: number) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    coins: 0,
    gems: 0,

    addCoins: (amount: number) =>
        set((state) => ({
            coins: state.coins + amount,
        })),

    minusCoins: (amount: number) =>
        set((state) => ({
            coins: Math.max(0, state.coins - amount),
        })),

    setCoins: (value: number) =>
        set({
            coins: value,
        }),

    setGems: (value: number) =>
        set({
            gems: value,
        }),
}));
