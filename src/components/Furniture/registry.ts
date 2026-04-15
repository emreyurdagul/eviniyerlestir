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

  // ── Banyo (Agent A) ──
  toilet:            (d, variant) => variant === 'wall'
                      ? { w: 0.42, h: 1.10, d: (d.depth ?? 60)/100 + 0.04 }
                      : { w: 0.44, h: 1.00, d: (d.depth ?? 70)/100 + 0.04 },
  sink:              (d, variant) => {
                      const w = (d.width ?? 60) / 100
                      if (variant === 'double') return { w: Math.max(w, 1.0) + 0.06, h: 1.12, d: 0.54 }
                      if (variant === 'square') return { w: w + 0.06, h: 1.15, d: 0.54 }
                      return { w: w + 0.04, h: 1.16, d: 0.50 }
                    },
  shower:            d => ({ w: (d.width ?? 90)/100 + 0.04, h: 2.04, d: (d.depth ?? 90)/100 + 0.04 }),
  bathtub:           (d, variant) => variant === 'freestanding'
                      ? { w: (d.length ?? 170)/100 + 0.10, h: 0.78, d: (d.width ?? 80)/100 + 0.14 }
                      : { w: (d.length ?? 170)/100 + 0.04, h: 0.62, d: (d.width ?? 75)/100 + 0.04 },
  'bathroom-cabinet': d => ({ w: (d.width ?? 60)/100 + 0.04, h: (d.height ?? 70)/100 + 0.08, d: 0.22, yOffset: 1.00 }),

  // ── Oturma aksesuar (Agent A) ──
  barstool:  d => ({ w: (d.diameter ?? 38)/100 + 0.04, h: 1.10, d: (d.diameter ?? 38)/100 + 0.04 }),
  ottoman:   d => ({ w: (d.width ?? 60)/100 + 0.04, h: 0.46, d: (d.length ?? 60)/100 + 0.04 }),
  recliner:  d => ({ w: (d.width ?? 95)/100 + 0.06, h: 1.30, d: (d.depth ?? 100)/100 + 0.06 }),
  beanbag:   d => { const s = (d.diameter ?? 100)/100; return { w: s * 1.15 + 0.04, h: s * 0.90, d: s * 1.05 + 0.04 } },
  bench:     d => ({ w: (d.length ?? 120)/100 + 0.04, h: 0.70, d: (d.width ?? 40)/100 + 0.04 }),

  // ── Çalışma (Agent B) ──
  desk:              d => ({ w: (d.length ?? 140)/100 + 0.10, h: 0.78, d: (d.depth  ?? 70)/100 + 0.10 }),
  'office-chair':    () => ({ w: 0.66, h: 1.14, d: 0.66 }),
  'filing-cabinet':  d => ({ w: (d.width  ?? 45)/100 + 0.06, h: (d.height ?? 100)/100 + 0.04, d: (d.depth ?? 50)/100 + 0.06 }),
  bookcase:          d => ({ w: (d.width  ?? 80)/100 + 0.08, h: (d.height ?? 200)/100 + 0.06, d: 0.36 }),
  monitor:           d => { const diag = d.diagonal ?? 27; const pw = (diag * 2.54 * 0.87)/100; return { w: pw + 0.06, h: pw * 9/16 + (pw * 9/16) * 0.6 + 0.08, d: 0.30 } },

  // ── Çocuk (Agent B) ──
  crib:              d => ({ w: (d.length ?? 120)/100 + 0.08, h: 0.98, d: (d.width ?? 60)/100 + 0.08 }),
  'bunk-bed':        d => ({ w: (d.length ?? 200)/100 + 0.10, h: 1.78, d: (d.width ?? 90)/100 + 0.28 }),
  'toy-storage':     d => ({ w: (d.width  ?? 90)/100 + 0.06, h: (d.height ?? 70)/100 + 0.20, d: 0.40 }),
  'kids-desk':       d => ({ w: (d.length ?? 80)/100 + 0.06, h: 0.58, d: (d.depth ?? 50)/100 + 0.06 }),
  'changing-table':  d => ({ w: (d.width  ?? 90)/100 + 0.06, h: 1.08, d: (d.depth ?? 55)/100 + 0.06 }),

  // ── Bahçe / Dış Mekan (Agent C) ──
  'garden-chair':    d => ({ w: (d.diameter ?? 55)/100 + 0.06, h: 0.90, d: (d.diameter ?? 55)/100 + 0.06 }),
  'garden-table':    d => ({ w: (d.diameter ?? 90)/100 + 0.06, h: 0.78, d: (d.diameter ?? 90)/100 + 0.06 }),
  umbrella:          d => ({ w: (d.diameter ?? 250)/100 + 0.10, h: 2.50, d: (d.diameter ?? 250)/100 + 0.10 }),
  hammock:           d => ({ w: (d.length ?? 220)/100 + 0.20, h: 1.30, d: 0.70 }),
  'bbq-grill':       d => ({ w: (d.diameter ?? 55)/100 + 0.08, h: 1.10, d: (d.diameter ?? 55)/100 + 0.08 }),

  // ── Dekor genişleme (Agent C) ──
  mirror:       d => ({ w: (d.width ?? 60)/100 + 0.04, h: (d.height ?? 80)/100 + 0.04, d: 0.08, yOffset: 1.30 }),
  'wall-art':   d => ({ w: (d.width ?? 60)/100 + 0.04, h: (d.height ?? 80)/100 + 0.04, d: 0.08, yOffset: 1.40 }),
  'wall-clock': d => ({ w: (d.diameter ?? 35)/100 + 0.04, h: (d.diameter ?? 35)/100 + 0.04, d: 0.08, yOffset: 1.70 }),
  curtain:      d => ({ w: (d.width ?? 180)/100 + 0.10, h: (d.height ?? 220)/100 + 0.05, d: 0.12, yOffset: 0.10 }),
  vase:         d => ({ w: (d.diameter ?? 20)/100 + 0.04, h: (d.height ?? 45)/100 + 0.25, d: (d.diameter ?? 20)/100 + 0.04 }),
  candle:       d => ({ w: (d.diameter ?? 25)/100 + 0.04, h: 0.30, d: (d.diameter ?? 25)/100 + 0.04 }),

  // ── Yapısal (Merdiven) ──
  stair:        d => ({ w: (d.width ?? 100)/100 + 0.10, h: (d.height ?? 280)/100, d: (d.length ?? 350)/100 + 0.10 }),

  // ── Yapısal Bahçe (Agent E) ──
  pool:         d => ({ w: (d.length ?? 800)/100 + 0.20, h: 0.20, d: (d.width  ?? 400)/100 + 0.20 }),
  fence:        d => ({ w: (d.length ?? 200)/100 + 0.10, h: (d.height ?? 120)/100 + 0.10, d: 0.15 }),
  gate:         d => ({ w: (d.width  ?? 150)/100 + 0.50, h: 2.35, d: 0.30 }),
  greenhouse:   d => ({ w: (d.width  ?? 300)/100 + 0.10, h: 2.50, d: (d.depth  ?? 250)/100 + 0.10 }),
  'grass-patch':d => ({ w: (d.length ?? 400)/100,         h: 0.05, d: (d.width  ?? 300)/100 }),
  tree:         d => ({ w: (d.diameter ?? 200)/100 + 0.10, h: (d.height ?? 400)/100, d: (d.diameter ?? 200)/100 + 0.10 }),

  // ── Yatak odası aksesuar (Agent F) ──
  nightstand:   d => ({ w: (d.width ?? 50)/100 + 0.04, h: (d.height ?? 55)/100, d: 0.42 }),
  dresser:      d => ({ w: (d.width ?? 140)/100 + 0.06, h: (d.height ?? 85)/100, d: 0.50 }),
}

export function getBoundingBox(type: string, dims: Record<string, number>, variant?: string): BoundingBox {
  const fn = boundingBoxFns[type]
  return fn ? fn(dims, variant) : { w: 0.8, h: 0.8, d: 0.8 }
}
