/**
 * DimensionHUD — sürükleme sırasında cursor yanında görünen boyut etiketi.
 *
 * HTML overlay (`position: fixed`). SVG değil çünkü zoom/pan transform'undan
 * etkilenmemesi gerek — cursor'a takılı kalır. Figma hissi.
 *
 * İçerik dinamik:
 *   - Room move:   W 350 × H 240
 *   - Resize:      W 360 → 400 (+40)
 *   - Wall draw:   350 cm (· Enter yaz: 3.6m kilidi)
 *   - Vertex drag: Δ +40 × -20
 */

interface Props {
  /** Ekran pixel koordinatı (e.clientX, e.clientY) */
  x: number
  y: number
  /** Gösterilecek metin satırları — ilk satır büyük, diğerleri küçük hint */
  lines: string[]
  /** Opsiyonel offset (varsayılan: cursor'un sağ-altında 14px) */
  dx?: number
  dy?: number
}

export default function DimensionHUD({ x, y, lines, dx = 14, dy = 14 }: Props) {
  if (!lines.length) return null
  return (
    <div
      className="fixed pointer-events-none z-[250] bg-stone-900/92 text-white rounded-md shadow-lg px-2.5 py-1.5"
      style={{ left: x + dx, top: y + dy }}
    >
      <div className="text-[11px] font-mono font-semibold leading-tight whitespace-nowrap">
        {lines[0]}
      </div>
      {lines.slice(1).map((line, i) => (
        <div key={i} className="text-[9px] text-stone-300 leading-tight whitespace-nowrap">
          {line}
        </div>
      ))}
    </div>
  )
}
