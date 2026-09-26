interface BoundingBox {
  w: number
  h: number
  d: number
  yOffset?: number   // taban y pozisyonu (tavan/duvar lambaları için > 0)
}

/** cm cinsinden boyutun varsayılandan farkı, metre olarak. */
const t = (v: number | undefined, def: number) => ((v ?? def) - def) / 100
/** Varsayılanın altında ve üstünde farklı eğimle büyüyen ölçü (modeldeki min/max kıskaçları). */
const bend = (x: number, below: number, above: number) => (x < 0 ? below * x : above * x)

/**
 * Mobilyaların fiziksel sınır kutusu (metre). Model merkezinden simetrik,
 * her yanda ~1 cm pay ile modelin tamamını kapsar.
 *
 * Formüller her modelin min/varsayılan/max boyutlarında three.js ile ölçülmüş
 * gerçek sınırlarından türetildi; registry.test.tsx her modeli render edip
 * kutunun modeli kapsadığını ve gereksiz büyük olmadığını doğrular. Bir modeli
 * değiştirince bu testi çalıştır.
 */
const boundingBoxFns: Record<string, (dims: Record<string, number>, variant?: string) => BoundingBox> = {
  sofa: (d, v) => {
    if (v === 'modern') return { w: 2.42 + 1 * t(d.length, 240), h: 0.91, d: 0.94 }
    if (v === 'chesterfield') return { w: 2.6 + 1 * t(d.length, 240), h: 1.01, d: 0.96 }
    if (v === 'minimal') return { w: 2.42 + 1 * t(d.length, 240), h: 0.81, d: 0.82 }
    return { w: 2.42 + 1 * t(d.length, 240), h: 1.01, d: 0.92 }
  },
  chair: (d, v) => {
    if (v === 'accent') return { w: 0.758 + 0.82 * t(d.diameter, 90), h: 0.997, d: 0.82 + 0.82 * t(d.diameter, 90) }
    if (v === 'wingback') return { w: 0.865 + 0.86 * t(d.diameter, 90), h: 1.27, d: 0.868 + 0.92 * t(d.diameter, 90) }
    return { w: 0.92 + 1 * t(d.diameter, 90), h: 0.89, d: 0.9 + bend(t(d.diameter, 90), 0.933, 1) }
  },
  dchair: (_d, v) => {
    if (v === 'upholstered') return { w: 0.48, h: 1.013, d: 0.501 }
    if (v === 'scandi') return { w: 0.477, h: 0.908, d: 0.467 }
    return { w: 0.46, h: 0.99, d: 0.464 }
  },
  ctable: (d, v) => {
    if (v === 'square') return { w: 1.02 + 1 * t(d.diameter, 100), h: 0.455, d: 1.02 + 1 * t(d.diameter, 100) }
    if (v === 'marble') return { w: 1.02 + 1 * t(d.diameter, 100), h: 0.43, d: 1.02 + 1 * t(d.diameter, 100) }
    return { w: 1.02 + 1 * t(d.diameter, 100), h: 0.905 + 0.5 * t(d.diameter, 100), d: 1.02 + 1 * t(d.diameter, 100) }
  },
  tvunit: (d, v) => {
    if (v === 'floating') return { w: 1.93 + 0.991 * t(d.length, 190), h: 1.923 + bend(t(d.length, 190), 0.318, 0.42), d: 0.338 }
    return { w: 1.94 + 0.991 * t(d.length, 190), h: 1.645 + bend(t(d.length, 190), 0.27, 0.392), d: 0.488 }
  },
  dtable: (d, v) => {
    if (v === 'modern') return { w: 2.063 + 1 * t(d.length, 180), h: 0.759, d: 0.93 + 1 * t(d.width, 90) }
    if (v === 'pedestal') return { w: 1.82 + 1 * t(d.length, 180), h: 0.79, d: 0.92 + 1 * t(d.width, 90) }
    return { w: 1.82 + 1 * t(d.length, 180), h: 0.794, d: 0.92 + 1 * t(d.width, 90) }
  },
  bed: (d, v) => {
    if (v === 'modern') return { w: 1.76 + 1 * t(d.width, 160), h: 0.69, d: 2.16 + 1 * t(d.length, 200) }
    if (v === 'tufted') return { w: 1.72 + 1 * t(d.width, 160), h: 1.27, d: 2.14 + 1 * t(d.length, 200) }
    if (v === 'single') return { w: 1.16 + bend(t(d.width, 160), 0.375, 0), h: 1.038, d: 2.301 + bend(t(d.length, 200), 1, 0) }
    if (v === 'queen') return { w: 1.68 + 1 * t(d.width, 160), h: 1.01, d: 2.06 + 1 * t(d.length, 200) }
    if (v === 'king') return { w: 1.75 + 1 * t(d.width, 160), h: 0.739, d: 2.16 + 1 * t(d.length, 200) }
    if (v === 'canopy') return { w: 1.98 + 1 * t(d.width, 160), h: 2.31, d: 2.38 + 1 * t(d.length, 200) }
    return { w: 1.74 + 1 * t(d.width, 160), h: 1.18, d: 2.06 + 1 * t(d.length, 200) }
  },
  wardrobe: (d, v) => {
    if (v === 'sliding') return { w: 1.22 + 1 * t(d.width, 120), h: 2.11, d: 0.708 + 1 * t(d.depth, 60) }
    return { w: 1.28 + 1 * t(d.width, 120), h: 2.11, d: 0.705 + 1 * t(d.depth, 60) }
  },
  shelf: (d, v) => {
    if (v === 'ladder') return { w: 0.815 + 1 * t(d.width, 80), h: 1.828 + 0.998 * t(d.height, 180), d: 0.42 }
    if (v === 'cube') return { w: 0.825 + 1 * t(d.width, 80), h: 1.81 + 1 * t(d.height, 180), d: 0.34 }
    return { w: 0.82 + 1 * t(d.width, 80), h: 1.815 + 0.995 * t(d.height, 180), d: 0.34 }
  },
  floorlamp: (_d, v) => {
    if (v === 'arc') return { w: 0.5, h: 1.955, d: 0.5 }  // taban; kol mobilyanın üstünden geçer
    if (v === 'tripod') return { w: 0.737, h: 2.063, d: 0.646 }
    return { w: 0.46, h: 1.883, d: 0.46 }
  },
  ceilinglamp: (d, v) => {
    if (v === 'chandelier') return { w: 0.558 + 0.85 * t(d.diameter, 55), h: 0.57 + bend(t(d.diameter, 55), 0, 0.024), d: 0.586 + 0.85 * t(d.diameter, 55), yOffset: 2.1 }
    if (v === 'panel') return { w: 0.57 + 1 * t(d.diameter, 55), h: 0.788 + 0.5 * t(d.diameter, 55), d: 0.57 + 1 * t(d.diameter, 55), yOffset: 2.1 }
    return { w: 0.57 + 0.999 * t(d.diameter, 55), h: 0.57 + bend(t(d.diameter, 55), 0, 0.337), d: 0.57 + 0.999 * t(d.diameter, 55), yOffset: 2.1 }
  },
  wallsconce: (d, v) => {
    if (v === 'classic') return { w: 0.32 + 1.2 * t(d.width, 25), h: 0.43, d: 0.54 + 1.2 * t(d.width, 25), yOffset: 1.65 }
    return { w: 0.1, h: 0.311 + 0.5 * t(d.width, 25), d: 0.078, yOffset: 1.65 }
  },
  rug: d => ({ w: 2.08 + 1 * t(d.length, 200), h: 0.032, d: 1.52 + 1 * t(d.width, 150) }),
  plant: (d, v) => {
    if (v === 'tall') return { w: 1.467 + 3.619 * t(d.diameter, 40), h: 1.902 + 4.729 * t(d.diameter, 40), d: 1.348 + 3.321 * t(d.diameter, 40) }
    if (v === 'cactus') return { w: 0.52 + 1.25 * t(d.diameter, 40), h: 0.98 + 2.425 * t(d.diameter, 40), d: 0.3 + 0.7 * t(d.diameter, 40) }
    return { w: 0.997 + 2.442 * t(d.diameter, 40), h: 1.148 + 2.845 * t(d.diameter, 40), d: 1.022 + 2.505 * t(d.diameter, 40) }
  },
  lsofa: (d, v) => {
    if (v === 'chaise') return { w: 2.92 + 1 * t(d.length, 290), h: 0.95, d: 2.02 + 1 * t(d.width, 200) }
    if (v === 'modern') return { w: 2.92 + 1 * t(d.length, 290), h: 0.9, d: 2.02 + 1 * t(d.width, 200) }
    return { w: 2.92 + 1 * t(d.length, 290), h: 0.99, d: 2.02 + 1 * t(d.width, 200) }
  },
  counter: d => ({ w: 1.84 + 1 * t(d.length, 180), h: 0.93, d: 0.686 + 1 * t(d.depth, 60) }),
  ankastre: d => ({ w: 0.62 + 1 * t(d.width, 60), h: 0.961, d: 0.66 }),
  kitchencab: d => ({ w: 0.62 + 1 * t(d.width, 60), h: 2.11, d: 0.45 + 1 * t(d.depth, 35) }),
  fridge: (d, v) => {
    if (v === 'sidebyside') return { w: 0.87 + bend(t(d.width, 70), 0, 0.5), h: 1.86, d: 0.778 + 1 * t(d.depth, 65) }
    if (v === 'french') return { w: 0.87 + bend(t(d.width, 70), 0, 0.5), h: 1.86, d: 0.752 + 1 * t(d.depth, 65) }
    return { w: 0.72 + 1 * t(d.width, 70), h: 1.86, d: 0.771 + 1 * t(d.depth, 65) }
  },
  washer: () => ({ w: 0.62, h: 0.88, d: 0.666 }),
  dishwasher: () => ({ w: 0.62, h: 0.88, d: 0.696 }),
  dryer: () => ({ w: 0.635, h: 0.88, d: 0.666 }),
  toilet: (d, v) => {
    if (v === 'wall') return { w: 0.5, h: 1.11, d: 0.72 + 1 * t(d.depth, 70) }
    return { w: 0.42, h: 0.965, d: 0.98 + 1 * t(d.depth, 70) }
  },
  sink: (d, v) => {
    if (v === 'square') return { w: 0.66 + 1 * t(d.width, 60), h: 1.144, d: 0.545 }
    if (v === 'double') return { w: 1.06 + bend(t(d.width, 60), 0, 0.5), h: 1.101, d: 0.54 }
    return { w: 0.62 + bend(t(d.width, 60), 0.8, 1), h: 1.17, d: 0.5 }
  },
  shower: (d, v) => {
    if (v === 'corner') return { w: 1.01 + 1 * t(d.width, 90) + 0.312 * t(d.depth, 90), h: 2.03, d: 1.091 + bend(t(d.width, 90), 0, 0.756) + bend(t(d.depth, 90), 0.856, 1) }
    return { w: 0.96 + 1 * t(d.width, 90), h: 2.03, d: 1.091 + 1 * t(d.depth, 90) }
  },
  bathtub: (d, v) => {
    if (v === 'freestanding') return { w: 2.036 + 1 * t(d.length, 170), h: 0.785 + 0.5 * t(d.width, 75), d: 0.77 + 1 * t(d.width, 75) }
    return { w: 1.72 + 1 * t(d.length, 170), h: 0.693, d: 0.77 + 1 * t(d.width, 75) }
  },
  'bathroom-cabinet': d => ({ w: 0.62 + 1 * t(d.width, 60), h: 0.743 + 1 * t(d.height, 70), d: 0.255, yOffset: 1.2 }),
  barstool: (d, v) => {
    if (v === 'classic') return { w: 0.4 + 1 * t(d.diameter, 38), h: 1.15, d: 0.4 + 1 * t(d.diameter, 38) }
    return { w: 0.4 + 1 * t(d.diameter, 38), h: 1.121, d: 0.4 + 1 * t(d.diameter, 38) }
  },
  ottoman: d => ({ w: 0.62 + 1 * t(d.width, 60), h: 0.452, d: 0.62 + 1 * t(d.length, 60) }),
  recliner: (d, v) => {
    if (v === 'leather') return { w: 0.95 + 1 * t(d.width, 95), h: 1.312, d: 1.3 + 1 * t(d.depth, 100) }
    return { w: 0.97 + 1 * t(d.width, 95), h: 1.283, d: 1.16 + 1 * t(d.depth, 100) }
  },
  beanbag: d => ({ w: 1.17 + 1.15 * t(d.diameter, 100), h: 0.76 + 0.75 * t(d.diameter, 100), d: 1.054 + 1.034 * t(d.diameter, 100) }),
  bench: (d, v) => {
    if (v === 'upholstered') return { w: 1.22 + 1 * t(d.length, 120), h: 0.456, d: 0.42 + 1 * t(d.width, 40) }
    return { w: 1.22 + 1 * t(d.length, 120), h: 0.48, d: 0.42 + 1 * t(d.width, 40) }
  },
  desk: d => ({ w: 1.42 + 1 * t(d.length, 140), h: 0.75, d: 0.72 + 1 * t(d.depth, 70) }),
  'office-chair': (_d, v) => {
    if (v === 'basic') return { w: 0.688, h: 0.912, d: 0.631 }
    if (v === 'executive') return { w: 0.688, h: 1.127, d: 0.631 }
    return { w: 0.688, h: 1.052, d: 0.631 }
  },
  'filing-cabinet': d => ({ w: 0.49 + 1 * t(d.width, 45), h: 1.02 + 1 * t(d.height, 100), d: 0.568 + 1 * t(d.depth, 50) }),
  bookcase: (d, v) => {
    if (v === 'glass') return { w: 0.82 + 1 * t(d.width, 80), h: 2.01 + 1 * t(d.height, 200), d: 0.348 }
    return { w: 0.82 + 1 * t(d.width, 80), h: 2.01 + 1 * t(d.height, 200), d: 0.32 }
  },
  monitor: d => ({ w: 0.617 + 2.21 * t(d.diagonal, 27), h: 0.567 + 1.989 * t(d.diagonal, 27), d: 0.3 }),
  crib: (d, v) => {
    if (v === 'modern') return { w: 1.22 + 1 * t(d.length, 120), h: 0.85, d: 0.62 + 1 * t(d.width, 60) }
    return { w: 1.22 + 1 * t(d.length, 120), h: 0.91, d: 0.638 + bend(t(d.length, 120), 0.09, 0.24) + bend(t(d.width, 60), 0.55, 0.88) }
  },
  'bunk-bed': d => ({ w: 2.06 + 1 * t(d.length, 200), h: 1.71, d: 1.8 + 1 * t(d.length, 200) }),
  'toy-storage': d => ({ w: 0.92 + 1 * t(d.width, 90), h: 0.83 + 1 * t(d.height, 70), d: 0.38 }),
  'kids-desk': d => ({ w: 0.82 + 1 * t(d.length, 80), h: 0.578, d: 0.52 + 1 * t(d.depth, 50) }),
  'changing-table': d => ({ w: 0.92 + 1 * t(d.width, 90), h: 1.06, d: 0.628 + 1 * t(d.depth, 55) }),
  'garden-chair': (d, v) => {
    if (v === 'metal') return { w: 0.556 + 1 * t(d.diameter, 55), h: 0.924, d: 0.556 + 1 * t(d.diameter, 55) }
    return { w: 0.57 + 1 * t(d.diameter, 55), h: 0.93, d: 0.57 + 1 * t(d.diameter, 55) }
  },
  'garden-table': (d, v) => {
    if (v === 'square') return { w: 0.92 + 1 * t(d.diameter, 90), h: 0.75, d: 0.92 + 1 * t(d.diameter, 90) }
    return { w: 0.92 + 1 * t(d.diameter, 90), h: 0.761, d: 0.92 + 1 * t(d.diameter, 90) }
  },
  umbrella: d => ({ w: 2.51 + 1 * t(d.diameter, 250), h: 2.44 + 0.005 * t(d.diameter, 250), d: 2.51 + 1 * t(d.diameter, 250) }),
  hammock: d => ({ w: 2.519 + 1 * t(d.length, 220), h: 1.208, d: 0.62 }),
  'bbq-grill': d => ({ w: 0.57 + 1 * t(d.diameter, 55), h: 1.225 + bend(t(d.diameter, 55), 0.431, 0.681), d: 0.907 + 1.612 * t(d.diameter, 55) }),
  mirror: (d, v) => {
    if (v === 'round') return { w: 0.62 + bend(t(d.width, 60), 1, 0.222) + bend(t(d.height, 80), 0.5, 0), h: 0.31 + bend(t(d.width, 60), 0.5, 0.111) + bend(t(d.height, 80), 0.25, 0), d: 0.1, yOffset: 1.3 }
    if (v === 'oval') return { w: 0.62 + 1 * t(d.width, 60), h: 0.41 + 0.5 * t(d.height, 80), d: 0.156, yOffset: 1.3 }
    return { w: 0.62 + 1 * t(d.width, 60), h: 0.41 + 0.5 * t(d.height, 80), d: 0.1, yOffset: 1.3 }
  },
  'wall-art': (d, v) => {
    if (v === 'classic') return { w: 0.62 + 1 * t(d.width, 60), h: 0.41 + 0.5 * t(d.height, 80), d: 0.14, yOffset: 1.4 }
    return { w: 0.62 + 1 * t(d.width, 60), h: 0.41 + 0.5 * t(d.height, 80), d: 0.1, yOffset: 1.4 }
  },
  vase: (d, v) => {
    if (v === 'short') return { w: 0.22 + bend(t(d.diameter, 20), 0.545, 1), h: 0.58 + 0.85 * t(d.height, 45), d: 0.316 + bend(t(d.diameter, 20), 0.45, 0.521) }
    if (v === 'wide') return { w: 0.22 + bend(t(d.diameter, 20), -0.495, 1), h: 0.636 + 0.8 * t(d.height, 45), d: 0.397 + 0.433 * t(d.diameter, 20) }
    return { w: 0.22 + bend(t(d.diameter, 20), 0.74, 1), h: 0.796 + 1 * t(d.height, 45), d: 0.325 + bend(t(d.diameter, 20), 0, 0.473) }
  },
  'wall-clock': d => ({ w: 0.37 + 1 * t(d.diameter, 35), h: 0.185 + 0.5 * t(d.diameter, 35), d: 0.1, yOffset: 1.7 }),
  curtain: (d, v) => {
    if (v === 'flat') return { w: 2.07 + 1 * t(d.width, 180), h: 2.205 + 1 * t(d.height, 220), d: 0.13, yOffset: 0.1 }
    if (v === 'shades') return { w: 1.887 + 1 * t(d.width, 180), h: 2.204 + 1 * t(d.height, 220), d: 0.13, yOffset: 0.1 }
    return { w: 2.07 + 1 * t(d.width, 180), h: 2.205 + 1 * t(d.height, 220), d: 0.16, yOffset: 0.1 }
  },
  candle: d => ({ w: 0.32 + 1.2 * t(d.diameter, 25), h: 0.319 + 0.88 * t(d.diameter, 25), d: 0.32 + 1.2 * t(d.diameter, 25) }),
  stair: (d, v) => {
    if (v === 'lshape') return { w: 2.52 + bend(t(d.height, 280), 0.625, 0.75) + 0.5 * t(d.width, 100), h: 3.36 + bend(t(d.height, 280), 0.587, 1.169), d: 2.692 + bend(t(d.height, 280), 1.235, 0.504) + 0.5 * t(d.width, 100) }
    return { w: 1.16 + 1 * t(d.width, 100), h: 3.726 + 0.998 * t(d.height, 280) + 0.002 * t(d.length, 350), d: 3.707 + 0.039 * t(d.height, 280) + 0.968 * t(d.length, 350) }
  },
  pool: (d, v) => {
    if (v === 'kidney') return { w: 7.959 + bend(t(d.length, 800), 0.96, 1) + bend(t(d.width, 400), -0.115, -0.058), h: 0.15, d: 3.86 + bend(t(d.length, 800), 0.224, 0) + bend(t(d.width, 400), 0.86, 0.54) }
    if (v === 'lap') return { w: 8.02 + 1 * t(d.length, 800), h: 0.21, d: 4.02 + 1 * t(d.width, 400) }
    return { w: 8.02 + 1 * t(d.length, 800), h: 0.12, d: 4.02 + 1 * t(d.width, 400) }
  },
  fence: (d, v) => {
    if (v === 'metal') return { w: 2.04 + 1 * t(d.length, 200), h: 1.31 + 1 * t(d.height, 120), d: 0.12 }
    if (v === 'privacy') return { w: 2.02 + 1 * t(d.length, 200), h: 1.21 + 1 * t(d.height, 120), d: 0.14 }
    return { w: 2.05 + 1 * t(d.length, 200), h: 1.26 + 1 * t(d.height, 120), d: 0.11 }
  },
  gate: (d, v) => {
    if (v === 'flat') return { w: 2.04 + 1 * t(d.width, 150), h: 2.46, d: 0.28 }
    return { w: 1.98 + 1 * t(d.width, 150), h: 3 + 0.5 * t(d.width, 150), d: 0.28 }
  },
  greenhouse: d => ({ w: 3.06 + 1 * t(d.width, 300), h: 2.48, d: 2.56 + 1 * t(d.depth, 250) }),
  'grass-patch': d => ({ w: 4.02 + 1 * t(d.length, 400), h: 0.129 + 0.001 * t(d.width, 300), d: 3.02 + 1 * t(d.width, 300) }),
  tree: (d, v) => {
    if (v === 'pine') return { w: 1.97 + 0.975 * t(d.diameter, 200), h: 4.075 + 1.016 * t(d.height, 400), d: 2.02 + 1 * t(d.diameter, 200) }
    return { w: 2.02 + 1 * t(d.diameter, 200), h: 3.16 + 0.35 * t(d.height, 400) + 0.875 * t(d.diameter, 200), d: 2.243 + 1.111 * t(d.diameter, 200) }
  },
  nightstand: d => ({ w: 0.54 + 1 * t(d.width, 50), h: 0.56 + 1 * t(d.height, 55), d: 0.498 }),
  dresser: d => ({ w: 1.45 + 1 * t(d.width, 140), h: 0.86 + 1 * t(d.height, 85), d: 0.582 }),
  fireplace: (d, v) => {
    if (v === 'modern') return { w: 1.22 + 1 * t(d.width, 120), h: 1.06, d: 0.412 }
    if (v === 'electric') return { w: 1.22 + 1 * t(d.width, 120), h: 0.56, d: 0.223 }
    return { w: 1.34 + 1 * t(d.width, 120), h: 1.3, d: 0.58 }
  },
  piano: (_d, v) => {
    if (v === 'grand') return { w: 1.57, h: 1.995, d: 2.12 }
    return { w: 1.56, h: 1.21, d: 0.69 }
  },
  'air-conditioner': d => ({ w: 0.928 + 1 * t(d.width, 90), h: 0.31, d: 0.326, yOffset: 2.05 }),
  radiator: d => ({ w: 0.9 + 1 * t(d.width, 80), h: 0.62, d: 0.15, yOffset: 0.12 }),
  aquarium: d => ({ w: 1.244 + 1.02 * t(d.length, 120), h: 1.21, d: 0.584 }),
  'coat-rack': () => ({ w: 0.56, h: 1.911, d: 0.556 }),
  custom:    d => { const s = (d.scale ?? 100) / 100; return { w: s + 0.1, h: s + 0.1, d: s + 0.1 } },
}

export function getBoundingBox(type: string, dims: Record<string, number>, variant?: string): BoundingBox {
  const fn = boundingBoxFns[type]
  return fn ? fn(dims, variant) : { w: 0.8, h: 0.8, d: 0.8 }
}
