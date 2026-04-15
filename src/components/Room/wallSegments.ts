/**
 * wallSegments — bir duvar uzunluğu + açıklık listesinden görünür duvar
 * parçalarını (segment) hesaplayan saf fonksiyon.
 *
 * Örnek: 4m duvar + ortada 1m'lik pencere →
 *   Segment 1: [-2, -0.5]  (tam yükseklik)
 *   Segment 2: pencere üstü (0.5m)
 *   Segment 3: pencere altı (0.9m)
 *   Segment 4: [0.5, 2]    (tam yükseklik)
 *
 * WallWithOpenings.tsx içinde inline'dı; test edilebilirlik için ayrıldı.
 */

import type { WallOpening } from '../../types'

export interface WallSegment {
  /** Duvar boyunca merkez pozisyon (m, -wallLength/2 ... +wallLength/2) */
  x: number
  /** Yükseklik merkezi (m, 0 ... wallHeight) */
  y: number
  /** Segment genişliği (m) */
  width: number
  /** Segment yüksekliği (m) */
  height: number
}

/**
 * Duvar boyunca görünür parçaları hesaplar. Açıklık yok → tek segment.
 * Açıklıklar positionAlongWall'a göre sıralanır; her birinin sol / üst / alt
 * kısmı gerekirse ayrı segment olur.
 */
export function computeWallSegments(
  wallLengthM: number,
  wallHeightM: number,
  openings: WallOpening[]
): WallSegment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: wallHeightM / 2, width: wallLengthM, height: wallHeightM }]
  }

  const segments: WallSegment[] = []
  const sorted = [...openings].sort((a, b) => a.positionAlongWall - b.positionAlongWall)

  // Açıklıkları metre uzayına çevir
  const ops = sorted.map(o => {
    const centerX = (o.positionAlongWall - 0.5) * wallLengthM
    const wM = o.widthCm / 100
    const hM = o.heightCm / 100
    const bottomM = o.bottomCm / 100
    return {
      left: centerX - wM / 2,
      right: centerX + wM / 2,
      top: bottomM + hM,
      centerX,
      wM,
      bottomM,
    }
  })

  const leftEdge = -wallLengthM / 2
  const rightEdge = wallLengthM / 2
  let cursor = leftEdge

  for (const op of ops) {
    // Açıklık öncesi tam boy segment
    if (op.left > cursor + 0.01) {
      const segW = op.left - cursor
      segments.push({ x: cursor + segW / 2, y: wallHeightM / 2, width: segW, height: wallHeightM })
    }

    // Açıklık üstü (kiriş) segmenti
    if (op.top < wallHeightM - 0.01) {
      segments.push({
        x: op.centerX,
        y: (op.top + wallHeightM) / 2,
        width: op.wM,
        height: wallHeightM - op.top,
      })
    }

    // Açıklık altı (denizlik — pencereler için) segmenti
    if (op.bottomM > 0.01) {
      segments.push({ x: op.centerX, y: op.bottomM / 2, width: op.wM, height: op.bottomM })
    }

    cursor = op.right
  }

  // Son açıklık sonrası kalan segment
  if (cursor < rightEdge - 0.01) {
    const segW = rightEdge - cursor
    segments.push({ x: cursor + segW / 2, y: wallHeightM / 2, width: segW, height: wallHeightM })
  }

  return segments
}
