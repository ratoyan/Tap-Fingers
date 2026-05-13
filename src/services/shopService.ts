import api from './api';

export async function fetchShopItems() {
    const {data} = await api.get('/shop/items');
    return data.items as any[];
}

export async function purchaseItem(itemKey: string) {
    const {data} = await api.post('/shop/purchase', {item_key: itemKey});
    return data;
}
