/**
 * PlanSummary — PropertiesPanel üstünde beliren özet kart.
 * Toplam alan, oda ve eşya sayısı + yaşam/servis alan ayrışımı gösterir.
 *
 * Saf presentational bileşen — store okumaz, veriyi parent hesaplayıp geçer.
 */

interface Props {
  totalAreaM2: number
  roomCount: number
  furnitureCount: number
  livingAreaM2: number
  serviceAreaM2: number
}

export default function PlanSummary({
  totalAreaM2,
  roomCount,
  furnitureCount,
  livingAreaM2,
  serviceAreaM2,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-stone-50 border border-amber-200/50 rounded-xl p-2 mb-2.5">
      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">📐 Plan Özeti</div>
      <div className="grid grid-cols-3 gap-1 text-center mb-1.5">
        <div className="bg-white/80 rounded-lg py-1.5 px-1">
          <div className="text-[15px] font-black text-amber-700 leading-none">{totalAreaM2.toFixed(1)}</div>
          <div className="text-[8px] text-stone-400 mt-0.5">m² toplam</div>
        </div>
        <div className="bg-white/80 rounded-lg py-1.5 px-1">
          <div className="text-[15px] font-black text-emerald-700 leading-none">{roomCount}</div>
          <div className="text-[8px] text-stone-400 mt-0.5">oda</div>
        </div>
        <div className="bg-white/80 rounded-lg py-1.5 px-1">
          <div className="text-[15px] font-black text-sky-700 leading-none">{furnitureCount}</div>
          <div className="text-[8px] text-stone-400 mt-0.5">eşya</div>
        </div>
      </div>
      {(livingAreaM2 > 0 || serviceAreaM2 > 0) && (
        <div className="flex gap-1 text-[9px]">
          <div className="flex-1 bg-emerald-50 border border-emerald-200/50 rounded-lg px-1.5 py-1">
            <span className="font-bold text-emerald-700">{livingAreaM2.toFixed(1)} m²</span>
            <span className="text-stone-400 ml-0.5">yaşam</span>
          </div>
          <div className="flex-1 bg-sky-50 border border-sky-200/50 rounded-lg px-1.5 py-1">
            <span className="font-bold text-sky-700">{serviceAreaM2.toFixed(1)} m²</span>
            <span className="text-stone-400 ml-0.5">servis</span>
          </div>
        </div>
      )}
    </div>
  )
}
