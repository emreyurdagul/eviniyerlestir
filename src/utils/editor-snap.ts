/**
 * editor-snap — AdvancedFloorPlanEditor için smart guides + object-to-object snap.
 *
 * Saf fonksiyonlar (unit-testable). Editör local `ERoom` modelinde (cm cinsi)
 * çalışır — store'daki `Room` (metre cinsi) ile karıştırılmamalı. Kasıtlı
 * ayrıştırma: iki birimin karışması zor debug edilen bug'lar yaratır.
 *
 * İki hedef:
 *   1. Sürüklenen eleman başka elemanlarla hizalanınca pembe rehber çizgi
 *      (Figma magenta) göster + otomatik snap
 *   2. Obje kenarları grid'e değil komşu obje kenarlarına da yapışsın
 */

// ─── Tipler ───────────────────────────────────────────────────────────────────
export interface SnapERoom {
  id: string
  cx: number; cy: number      // merkez cm
  wCm: number; hCm: number    // genişlik, derinlik cm
  rot: number                 // radyan (rotated rect'ler için sadece axis-aligned snap)
}

export interface SnapVertex { id: string; x: number; y: number }

export type SnapKind =
  | 'edge-left' | 'edge-right' | 'edge-top' | 'edge-bottom'
  | 'center-x' | 'center-y'
  | 'vertex' | 'wall-mid'

export interface SnapTarget {
  axis: 'x' | 'y'
  value: number                 // dünya cm
  sourceId: string              // hangi elemandan geldi
  kind: SnapKind
  /** Perpendicular span — guide çizgisinin görünür uzunluğu için */
  perpMin: number
  perpMax: number
}

export interface Guide {
  axis: 'x' | 'y'
  value: number
  start: number      // perpendicular eksende görünür segment başı
  end: number        // perpendicular eksende görünür segment sonu
}

export interface SnapResult {
  dx: number
  dy: number
  guidesX: Guide[]
  guidesY: Guide[]
}

export interface SnapBounds {
  left: number; right: number
  top: number; bottom: number
  cx: number; cy: number
}

// ─── Hedef toplama ────────────────────────────────────────────────────────────

/**
 * Bir dikdörtgenin 3 X-aday (left, right, cx) + 3 Y-aday (top, bottom, cy) noktası vardır.
 * Vertex'ler tek X + tek Y hedefi üretir.
 * Döndürülmüş rect'ler axis-aligned hedef üretmez (bbox kullanmak kafa karıştırır).
 */
export function collectSnapTargets(
  excludeId: string,
  rooms: SnapERoom[],
  vertices: SnapVertex[],
): SnapTarget[] {
  const targets: SnapTarget[] = []

  for (const r of rooms) {
    if (r.id === excludeId) continue
    // Rotated rect'ler axis-aligned snap üretmesin
    // Bug-fix: 2π veya biriken rotasyonda |r.rot| > 0.001 kontrolü yanıltıcı;
    // 2π birikimlerinde bile gerçekte axis-aligned olanları yakala.
    const TWO_PI = 2 * Math.PI
    const normRot = ((r.rot % TWO_PI) + TWO_PI) % TWO_PI
    const aligned = normRot < 0.001 || Math.abs(normRot - Math.PI) < 0.001 || normRot > TWO_PI - 0.001
    if (!aligned) continue
    const hw = r.wCm / 2, hh = r.hCm / 2
    const L = r.cx - hw, R = r.cx + hw
    const T = r.cy - hh, B = r.cy + hh
    // X hedefleri
    targets.push({ axis: 'x', value: L,    sourceId: r.id, kind: 'edge-left',  perpMin: T, perpMax: B })
    targets.push({ axis: 'x', value: R,    sourceId: r.id, kind: 'edge-right', perpMin: T, perpMax: B })
    targets.push({ axis: 'x', value: r.cx, sourceId: r.id, kind: 'center-x',   perpMin: T, perpMax: B })
    // Y hedefleri
    targets.push({ axis: 'y', value: T,    sourceId: r.id, kind: 'edge-top',    perpMin: L, perpMax: R })
    targets.push({ axis: 'y', value: B,    sourceId: r.id, kind: 'edge-bottom', perpMin: L, perpMax: R })
    targets.push({ axis: 'y', value: r.cy, sourceId: r.id, kind: 'center-y',    perpMin: L, perpMax: R })
  }

  for (const v of vertices) {
    if (v.id === excludeId) continue
    // Vertex her iki eksende nokta hedefi — perp span vertex'in etrafında küçük
    targets.push({ axis: 'x', value: v.x, sourceId: v.id, kind: 'vertex', perpMin: v.y - 20, perpMax: v.y + 20 })
    targets.push({ axis: 'y', value: v.y, sourceId: v.id, kind: 'vertex', perpMin: v.x - 20, perpMax: v.x + 20 })
  }

  return targets
}

// ─── Smart snap ───────────────────────────────────────────────────────────────

/**
 * Sürüklenen elemanın 3 X-aday + 3 Y-aday kenarı hedeflerle kıyaslanır.
 * En yakın aday-hedef eşleşmesi threshold altındaysa:
 *   - dx/dy: uygulanacak delta (kenar hedefe tam otursun)
 *   - guidesX/Y: çizilecek pembe rehber çizgiler (çoklu hizalamada birden fazla)
 */
export function findSmartSnap(
  bounds: SnapBounds,
  targets: SnapTarget[],
  thresholdCm: number,
): SnapResult {
  const xCandidates: Array<{ value: number; kind: 'left' | 'right' | 'cx' }> = [
    { value: bounds.left,  kind: 'left'  },
    { value: bounds.right, kind: 'right' },
    { value: bounds.cx,    kind: 'cx'    },
  ]
  const yCandidates: Array<{ value: number; kind: 'top' | 'bottom' | 'cy' }> = [
    { value: bounds.top,    kind: 'top'    },
    { value: bounds.bottom, kind: 'bottom' },
    { value: bounds.cy,     kind: 'cy'     },
  ]

  // X ekseni — en yakın hedefi bul
  let bestDx = 0
  let bestDistX = thresholdCm
  const xGuides: Guide[] = []
  for (const cand of xCandidates) {
    for (const t of targets) {
      if (t.axis !== 'x') continue
      const d = Math.abs(t.value - cand.value)
      if (d < bestDistX - 0.01) {
        // Daha yakın bulundu — listeyi temizle
        bestDistX = d
        bestDx = t.value - cand.value
        xGuides.length = 0
        xGuides.push({
          axis: 'x',
          value: t.value,
          start: Math.min(bounds.top + bestDx * 0, t.perpMin),   // *0 no-op, stilistik
          end: Math.max(bounds.bottom, t.perpMax),
        })
      } else if (Math.abs(d - bestDistX) < 0.5 && Math.abs(t.value - (cand.value + bestDx)) < 0.5) {
        // Eş uzaklıkta çoklu hizalama — guide ekle (son snap değerine eşit olan hedefler)
        xGuides.push({
          axis: 'x',
          value: t.value,
          start: Math.min(bounds.top, t.perpMin),
          end: Math.max(bounds.bottom, t.perpMax),
        })
      }
    }
  }

  // Y ekseni — aynı mantık
  let bestDy = 0
  let bestDistY = thresholdCm
  const yGuides: Guide[] = []
  for (const cand of yCandidates) {
    for (const t of targets) {
      if (t.axis !== 'y') continue
      const d = Math.abs(t.value - cand.value)
      if (d < bestDistY - 0.01) {
        bestDistY = d
        bestDy = t.value - cand.value
        yGuides.length = 0
        yGuides.push({
          axis: 'y',
          value: t.value,
          start: Math.min(bounds.left, t.perpMin),
          end: Math.max(bounds.right, t.perpMax),
        })
      } else if (Math.abs(d - bestDistY) < 0.5 && Math.abs(t.value - (cand.value + bestDy)) < 0.5) {
        yGuides.push({
          axis: 'y',
          value: t.value,
          start: Math.min(bounds.left, t.perpMin),
          end: Math.max(bounds.right, t.perpMax),
        })
      }
    }
  }

  return {
    dx: bestDistX < thresholdCm ? bestDx : 0,
    dy: bestDistY < thresholdCm ? bestDy : 0,
    guidesX: bestDistX < thresholdCm ? xGuides : [],
    guidesY: bestDistY < thresholdCm ? yGuides : [],
  }
}

/**
 * Nokta (vertex) için smart snap — rect bounds yerine tek x,y noktası.
 */
export function findPointSnap(
  px: number, py: number,
  targets: SnapTarget[],
  thresholdCm: number,
): SnapResult {
  return findSmartSnap(
    { left: px, right: px, top: py, bottom: py, cx: px, cy: py },
    targets, thresholdCm,
  )
}
