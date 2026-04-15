interface BoundingBox {
  w: number
  h: number
  d: number
  yOffset?: number   // taban y pozisyonu (tavan/duvar lambaları için > 0)
}

const boundingBoxFns: Record<string, (dims: Record<string, number>, variant?: string) => BoundingBox> = {
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
  // Bitki türüne göre: tall/classic büyük yaprakları kaplıyor, cactus daha kompakt
  plant: (d, variant) => {
    const base = (d.diameter ?? 40) / 100
    if (variant === 'tall')   return { w: base * 3.5, h: 2.00, d: base * 3.5 }
    if (variant === 'cactus') return { w: base * 1.4, h: 1.10, d: base * 1.4 }
    return { w: base * 2.5, h: 0.80, d: base * 2.5 }   // classic varsayılan
  },
  custom:    d => { const s = (d.scale ?? 100) / 100; return { w: s + 0.1, h: s + 0.1, d: s + 0.1 } },
  lsofa:      d => ({ w: (d.length ?? 290)/100+0.1, h: 1.05, d: (d.width ?? 200)/100+0.1 }),
  counter:    d => ({ w: (d.length ?? 180)/100+0.1, h: 0.92, d: (d.depth  ??  60)/100+0.1 }),
  ankastre:   d => ({ w: (d.width  ??  60)/100+0.1, h: 0.90, d: 0.65 }),
  kitchencab: d => ({ w: (d.width  ??  60)/100+0.1, h: 2.10, d: (d.depth  ??  35)/100+0.1 }),
  fridge:     d => ({ w: (d.width  ??  70)/100+0.1, h: 1.85, d: (d.depth  ??  65)/100+0.1 }),
  washer:     () => ({ w: 0.70, h: 0.87, d: 0.65 }),
  dishwasher: () => ({ w: 0.70, h: 0.87, d: 0.65 }),
  dryer:      () => ({ w: 0.70, h: 0.87, d: 0.65 }),
  // Aydınlatma — tavan/duvar lambaları yerde değil
  ceilinglamp: d => ({ w: (d.diameter ?? 55)/100+0.1, h: 0.55, d: (d.diameter ?? 55)/100+0.1, yOffset: 2.10 }),
  wallsconce:  d => ({ w: (d.width ?? 25)/100+0.06, h: 0.35, d: 0.18, yOffset: 1.65 }),
}

export function getBoundingBox(type: string, dims: Record<string, number>, variant?: string): BoundingBox {
  const fn = boundingBoxFns[type]
  return fn ? fn(dims, variant) : { w: 0.8, h: 0.8, d: 0.8 }
}
