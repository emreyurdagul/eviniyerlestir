/**
 * RotationHandle — seçili rect oda üstünde görünür döndürme tutamacı.
 *
 * Figma-benzeri: bbox'ın üstünde, merkeze hizalı ~24cm yukarıda bir daire.
 * Pointer down → rotate drag başlatır. Sürüklenirken 5° snap (Shift basılı
 * değilse), Shift → serbest.
 */

interface Props {
  cx: number          // oda merkez x (cm)
  cy: number          // oda merkez y (cm)
  hh: number          // oda yarı-yüksekliği (cm)
  rot: number         // mevcut rotation (radyan)
  sc: number          // px/cm ölçek
  onPointerDown: (e: React.PointerEvent) => void
}

export default function RotationHandle({ cx, cy, hh, rot, sc, onPointerDown }: Props) {
  // Odanın "yukarı" vektörü local (0, -hh), rotate edilmiş
  const cosR = Math.cos(rot), sinR = Math.sin(rot)
  // 24 cm üstte (dünya cm)
  const offset = hh + 28
  const hx = cx + (-0) * cosR - (-offset) * sinR
  const hy = cy + (-0) * sinR + (-offset) * cosR
  // Bağlantı çizgisi (bbox üstünden handle'a)
  const tx = cx + (-0) * cosR - (-hh) * sinR
  const ty = cy + (-0) * sinR + (-hh) * cosR
  const r = 7 / sc

  return (
    <g>
      <line x1={tx} y1={ty} x2={hx} y2={hy}
        stroke="#2563eb" strokeWidth={1/sc} strokeDasharray={`${3/sc},${2/sc}`} />
      <circle
        cx={hx} cy={hy} r={r}
        fill="white" stroke="#2563eb" strokeWidth={1.5/sc}
        style={{ cursor: 'grab' }}
        onPointerDown={e => { e.stopPropagation(); onPointerDown(e) }}
      />
      {/* İçte küçük rotation ikonu — döner ok */}
      <path
        d={`M ${hx - r*0.35} ${hy - r*0.15}
            a ${r*0.5} ${r*0.5} 0 1 1 ${r*0.7} 0`}
        fill="none" stroke="#2563eb" strokeWidth={1/sc} strokeLinecap="round"
        pointerEvents="none"
      />
      <path
        d={`M ${hx + r*0.05} ${hy - r*0.15} l ${r*0.3} 0 l -${r*0.15} ${r*0.25} Z`}
        fill="#2563eb" pointerEvents="none"
      />
    </g>
  )
}
