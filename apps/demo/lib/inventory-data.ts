// Static demo data for Classic's Inventory page (app/(dashboard)/inventory): a homeware brand's products in three
// warehouses, with what's on hand, what's on its way and when to reorder. Replace it with your own stock system.

export const warehouses = ["jakarta", "surabaya", "singapore"] as const
export type Warehouse = (typeof warehouses)[number]
export type ItemCategory = "kitchen" | "living" | "bedroom" | "outdoor"

export type Item = {
  sku: string
  name: string
  category: ItemCategory
  warehouse: Warehouse
  onHand: number
  /** At or below this, it's time to order more. */
  reorderPoint: number
  /** Ordered and on its way. */
  incoming: number
  /** What one costs us, in dollars. */
  unitCost: number
}

// [sku, name, category, warehouse, on hand, reorder point, incoming, unit cost]
const rows: [string, string, ItemCategory, Warehouse, number, number, number, number][] = [
  ["KT-1001", "Stoneware mug, sand", "kitchen", "jakarta", 342, 120, 0, 4.2],
  ["KT-1002", "Stoneware mug, moss", "kitchen", "jakarta", 96, 120, 200, 4.2],
  ["KT-1010", "Teak serving board", "kitchen", "surabaya", 58, 40, 0, 11.5],
  ["KT-1014", "Linen apron", "kitchen", "jakarta", 0, 30, 60, 7.8],
  ["KT-1022", "Glass carafe, 1 L", "kitchen", "singapore", 134, 50, 0, 6.9],
  ["LV-2003", "Rattan side table", "living", "surabaya", 21, 15, 0, 38],
  ["LV-2008", "Wool throw, oat", "living", "jakarta", 12, 25, 40, 19.5],
  ["LV-2011", "Ceramic vase, tall", "living", "singapore", 77, 30, 0, 9.4],
  ["LV-2015", "Floor cushion, rust", "living", "jakarta", 44, 20, 0, 14],
  ["LV-2019", "Brass candle holder", "living", "singapore", 6, 20, 0, 8.6],
  ["BD-3002", "Cotton sheet set, queen", "bedroom", "jakarta", 188, 60, 0, 24],
  ["BD-3006", "Bamboo pillow", "bedroom", "surabaya", 31, 40, 80, 12.3],
  ["BD-3009", "Bedside lamp, clay", "bedroom", "singapore", 0, 15, 0, 22],
  ["BD-3012", "Waffle robe", "bedroom", "jakarta", 63, 30, 0, 17.8],
  ["OD-4001", "Folding chair, teak", "outdoor", "surabaya", 26, 12, 0, 44],
  ["OD-4005", "Woven planter, large", "outdoor", "surabaya", 9, 18, 24, 15.2],
  ["OD-4008", "Lantern, black iron", "outdoor", "singapore", 112, 40, 0, 10.1],
  ["OD-4012", "Outdoor rug, 2×3 m", "outdoor", "jakarta", 17, 10, 0, 52],
]

export const items: Item[] = rows.map(([sku, name, category, warehouse, onHand, reorderPoint, incoming, unitCost]) => ({
  sku,
  name,
  category,
  warehouse,
  onHand,
  reorderPoint,
  incoming,
  unitCost,
}))

export type StockStatus = "inStock" | "low" | "out"

/** How an item stands, with a safety margin on top of its reorder point (0.2 warns 20% earlier). */
export function stockStatus(item: Pick<Item, "onHand" | "reorderPoint">, margin = 0): StockStatus {
  if (item.onHand <= 0) return "out"
  return item.onHand <= item.reorderPoint * (1 + margin) ? "low" : "inStock"
}
