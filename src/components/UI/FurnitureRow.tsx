/**
 * FurnitureRow — PropertiesPanel içindeki tek bir mobilya kartı.
 *
 * Seçili durumda: boyut NumberField'ları + (lamba ise) LightControls paneli.
 * Seçili değilse sade başlık + sil butonu.
 *
 * Önceki halinde PropertiesPanel içinde 120+ satırlık `renderFurnItem` inner
 * function olarak yaşıyordu — ayrı dosya hem okunabilirlik hem de React'in
 * re-render davranışı için daha temiz.
 */

import type { FurnitureItem } from '../../types'
import { FURNITURE_CATALOG } from '../../types'
import NumberField from './NumberField'
import LightControls from './LightControls'

const LIGHT_TYPES = new Set(['floorlamp', 'ceilinglamp', 'wallsconce'])

interface Props {
  furniture: FurnitureItem
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onUpdate: (patch: Partial<FurnitureItem>) => void
}

export default function FurnitureRow({
  furniture: f,
  isSelected,
  onSelect,
  onRemove,
  onUpdate,
}: Props) {
  const cat = FURNITURE_CATALOG.find(c => c.type === f.type)
  const isLight = LIGHT_TYPES.has(f.type)
  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  return (
    <div
      onClick={onSelect}
      className={`mb-1 p-1.5 rounded-lg cursor-pointer border transition-colors ${
        isSelected
          ? 'bg-amber-50/70 border-amber-400/50'
          : 'bg-stone-50/50 border-stone-200/30 hover:bg-stone-100/60'
      }`}
      data-testid={`furn-item-${f.id}`}
    >
      <div className="flex justify-between items-center mb-0.5">
        <div className="flex items-center gap-1 text-[11.5px] font-bold text-stone-800">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
            style={{ background: hex(f.color) }}
          />
          {f.type === 'custom'
            ? `📦 ${f.customLabel ?? 'Model'}`
            : `${cat?.icon} ${cat?.label}`}
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          className="bg-red-100/60 border border-red-300/40 rounded px-2 py-1 sm:px-1 sm:py-0 text-red-600 text-xs sm:text-[10px] cursor-pointer hover:bg-red-200/60 min-w-[28px] min-h-[24px] sm:min-w-0 sm:min-h-0"
          data-testid={`furn-delete-${f.id}`}
        >
          ✕
        </button>
      </div>
      {cat?.dimDefs.map(def => (
        <div key={def.key} className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] text-stone-600">{def.label}</span>
          <NumberField
            value={f.dims[def.key] ?? def.def}
            min={def.min}
            max={def.max}
            step={1}
            unit={def.unit}
            inputClassName="w-12"
            testId={`furn-dim-${f.id}-${def.key}`}
            onChange={v => onUpdate({ dims: { ...f.dims, [def.key]: v } })}
          />
        </div>
      ))}

      {/* Aydınlatma kontrolleri — lümen / Kelvin / watt */}
      {isLight && isSelected && <LightControls furniture={f} onChange={onUpdate} />}
    </div>
  )
}
