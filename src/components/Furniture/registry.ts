import type { FurnitureConfig } from '../../types'
import { FURNITURE_CATALOG } from '../../types'

export interface BoundingBox {
  w: number
  h: number
  d: number
}

const boundingBoxFns: Record<string, (dims: Record<string, number>) => BoundingBox> = {
  sofa:      d => ({ w: (d.length ?? 240) / 100 + 0.22, h: 1.05, d: 1.14 }),
  chair:     d => ({ w: (d.diameter ?? 90) / 100 + 0.18, h: 1.14, d: (d.diameter ?? 90) / 100 + 0.18 }),
  dchair:    () => ({ w: 0.56, h: 1.06, d: 0.56 }),
  ctable:    d => ({ w: (d.diameter ?? 100) / 100 + 0.18, h: 0.58, d: (d.diameter ?? 100) / 100 + 0.18 }),
  tvunit:    d => ({ w: 0.62, h: 1.02, d: (d.length ?? 190) / 100 + 0.20 }),
  dtable:    d => ({ w: (d.length ?? 180) / 100 + 0.18, h: 0.90, d: (d.width ?? 90) / 100 + 0.14 }),
  bed:       d => ({ w: (d.width ?? 160) / 100 + 0.14, h: 0.70, d: (d.length ?? 200) / 100 + 0.14 }),
  wardrobe:  d => ({ w: (d.width ?? 120) / 100 + 0.10, h: 2.10, d: (d.depth ?? 60) / 100 + 0.10 }),
  shelf:     d => ({ w: (d.width ?? 80) / 100 + 0.10, h: (d.height ?? 180) / 100 + 0.10, d: 0.42 }),
  floorlamp: () => ({ w: 0.40, h: 1.80, d: 0.40 }),
  rug:       d => ({ w: (d.length ?? 200) / 100, h: 0.04, d: (d.width ?? 150) / 100 }),
  plant:     d => ({ w: (d.diameter ?? 40) / 100 + 0.10, h: 0.80, d: (d.diameter ?? 40) / 100 + 0.10 }),
}

export function getConfig(type: string): FurnitureConfig | undefined {
  return FURNITURE_CATALOG.find(c => c.type === type)
}

export function getBoundingBox(type: string, dims: Record<string, number>): BoundingBox {
  const fn = boundingBoxFns[type]
  return fn ? fn(dims) : { w: 0.8, h: 0.8, d: 0.8 }
}

export function getCatalog(): FurnitureConfig[] {
  return FURNITURE_CATALOG
}
