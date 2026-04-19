/**
 * GuideOverlay — smart alignment rehber çizgileri (Figma benzeri).
 *
 * Sürüklenen oda / vertex başka elemanlarla hizalandığında pembe (magenta)
 * dashed çizgiler çizer. Görsel dil Figma konvansiyonu:
 *   - Renk: #ff3e7f (selection mavisinden belirgin)
 *   - Dashed pattern: çok ince, sürekli hareket halindeyken okunabilir
 *
 * SVG `<g>` içine mount edilir — dünya koordinatlarında (cm).
 */

import type { Guide } from '../../../utils/editor-snap'

interface Props {
  guides: { guidesX: Guide[]; guidesY: Guide[] } | null
  sc: number    // px/cm ölçek — strokeWidth ve dash pattern scale için
}

export default function GuideOverlay({ guides, sc }: Props) {
  if (!guides) return null
  const sw = 1 / sc
  const dash = `${4 / sc},${3 / sc}`
  const color = '#ff3e7f'

  return (
    <g pointerEvents="none">
      {guides.guidesX.map((g, i) => (
        <line
          key={`gx${i}-${g.value}`}
          x1={g.value} y1={g.start}
          x2={g.value} y2={g.end}
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={dash}
        />
      ))}
      {guides.guidesY.map((g, i) => (
        <line
          key={`gy${i}-${g.value}`}
          x1={g.start}  y1={g.value}
          x2={g.end}    y2={g.value}
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={dash}
        />
      ))}
    </g>
  )
}
