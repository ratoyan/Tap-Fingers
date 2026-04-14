import {ShopType} from "../types/shop.type.ts";

export const shops: ShopType[] = [
    {id: "1", title: "Card 1", coins: "10", type: 'card', typeName: 'ballon', rotation: false},
    {id: "3", title: "Card 3", coins: "30", type: 'card', typeName: 'card', rotation: false},
    {id: "2", title: "Card 2", coins: "15", type: 'card', typeName: 'square', rotation: true},
    {id: "5", title: "Background 1", coins: "20", type: 'background', typeName: 'background'},
    {id: "6", title: "Background 2", coins: "30", type: 'background', typeName: 'background'},
];