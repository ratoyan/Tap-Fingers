import {ShopType} from "../types/shop.type.ts";

export const shops: ShopType[] = [
    {id: "1", title: "Card 1", coins: "10", type: 'card', typeName: 'ballon', isRotation: false, size: 130},
    {id: "3", title: "Card 3", coins: "30", type: 'card', typeName: 'card', isRotation: false, size: 100},
    {id: "2", title: "Card 2", coins: "15", type: 'card', typeName: 'square', isRotation: true, size: 100},
    {id: "7", title: "Star", coins: "25", type: 'card', typeName: 'star', isRotation: true, size: 100},
    {id: "8", title: "Diamond", coins: "40", type: 'card', typeName: 'diamond', isRotation: false, size: 100},
    {id: "9", title: "Heart", coins: "35", type: 'card', typeName: 'heart', isRotation: false, size: 100},
    {id: "10", title: "Bomb", coins: "50", type: 'card', typeName: 'bomb', isRotation: false, size: 100},
    {
        id: "5", title: "Background 1", coins: "20", type: 'background', typeName: 'background',
        images: [
            require('../assets/images/background1.jpg'),
            require('../assets/images/background2.jpg'),
            require('../assets/images/background3.jpg'),
            require('../assets/images/background4.jpg'),
            require('../assets/images/background1.jpg'),
        ],
    },
    {
        id: "6", title: "Background 2", coins: "30", type: 'background', typeName: 'background',
        images: [
            require('../assets/images/background2.jpg'),
            require('../assets/images/background3.jpg'),
            require('../assets/images/background4.jpg'),
            require('../assets/images/background1.jpg'),
            require('../assets/images/background2.jpg'),
        ],
    },
    {
        id: "11", title: "Background 3", coins: "35", type: 'background', typeName: 'background',
        images: [
            require('../assets/images/background3.jpg'),
            require('../assets/images/background4.jpg'),
            require('../assets/images/background1.jpg'),
            require('../assets/images/background2.jpg'),
            require('../assets/images/background3.jpg'),
        ],
    },
    {
        id: "12", title: "Background 4", coins: "40", type: 'background', typeName: 'background',
        images: [
            require('../assets/images/background4.jpg'),
            require('../assets/images/background1.jpg'),
            require('../assets/images/background2.jpg'),
            require('../assets/images/background3.jpg'),
            require('../assets/images/background4.jpg'),
        ],
    },
    {
        id: "13", title: "Night", coins: "25", type: 'background', typeName: 'background',
        colors: ['#03001C', '#06003a', '#090058', '#0c0076', '#0f0094'],
    },
    {
        id: "14", title: "Forest", coins: "30", type: 'background', typeName: 'background',
        colors: ['#0a2e12', '#0d3a16', '#10461a', '#13521e', '#165e22'],
    },
    {
        id: "15", title: "Volcano", coins: "45", type: 'background', typeName: 'background',
        colors: ['#2e0a03', '#3d0d04', '#4c1005', '#5b1306', '#6a1607'],
    },
];