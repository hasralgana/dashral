import type { ComponentType } from "react"

import { freeBlockComponents } from "./free"

// Every block, by slug: the free ones in free.ts. Dashral Pro adds its own blocks beside them.
export const blockComponents: Record<string, ComponentType> = { ...freeBlockComponents }

export { freeBlockComponents }
