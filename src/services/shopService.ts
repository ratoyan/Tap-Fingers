import api from './api';
import { InventoryEntry, ShopItem, ShopItemType } from './types';

// ── Shop service ──────────────────────────────────────────────────────────────
// Backend: GET /api/shop (public catalog), GET /api/shop/inventory,
// POST /api/shop/purchase { itemKey }, POST /api/shop/active { itemKey }.

export async function getItems(): Promise<ShopItem[]> {
    const { data } = await api.get('/shop');
    return data.data.items;
}

export async function getInventory(): Promise<InventoryEntry[]> {
    const { data } = await api.get('/shop/inventory');
    return data.data.items;
}

export interface PurchaseResult {
    success: boolean;
    item: ShopItem;
    remainingCoins: number;
}

export async function purchaseItem(itemKey: string): Promise<PurchaseResult> {
    const { data } = await api.post('/shop/purchase', { itemKey });
    return data.data;
}

export interface SetActiveResult {
    success: boolean;
    activeKey: string;
    type: ShopItemType;
}

// export async function setActiveItem(itemKey: string): Promise<SetActiveResult> {
//     const { data } = await api.post('/shop/active', { itemKey });
//     return data.data;
// }
