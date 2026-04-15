/**
 * LightControls — seçili lamba mobilyası için aydınlatma paneli.
 *
 * Kontroller:
 *   - Aç/Kapat anahtarı
 *   - Lümen slider (100-6000 lm) + LED Watt eşdeğeri gösterimi
 *   - Kelvin slider (2200-6500 K) + renk önizleme + sıcak↔soğuk gradient
 *   - Kelvin etiketi (Çok Sıcak / Sıcak Beyaz / Nötr Beyaz / Soğuk Beyaz / Gün Işığı)
 *
 * PropertiesPanel içindeki in-place IIFE'den çıkarıldı — kod daha anlaşılır ve
 * ileride başka yerden (örn. context menu) de çağrılabilir hale geldi.
 */

import type { FurnitureItem } from '../../types'
import {
  LUMEN_MIN, LUMEN_MAX, KELVIN_MIN, KELVIN_MAX,
  DEFAULT_LUMENS, DEFAULT_KELVIN,
} from '../../types'
import { kelvinToCss, kelvinLabel, lumensToLedWatts } from '../../utils/light'

interface Props {
  furniture: FurnitureItem
  onChange: (patch: Partial<FurnitureItem>) => void
}

export default function LightControls({ furniture: f, onChange }: Props) {
  // Mevcut değerler: önce lumens/colorTempK, sonra legacy lightIntensity, en son default
  const defaultLm = DEFAULT_LUMENS[f.type] ?? 800
  const defaultK = DEFAULT_KELVIN[f.type] ?? 2800
  const curLumens =
    f.lumens ??
    (f.lightIntensity !== undefined
      ? Math.round(f.lightIntensity * defaultLm * (1 / 0.6))
      : defaultLm)
  const curKelvin = f.colorTempK ?? defaultK
  const watts = lumensToLedWatts(curLumens)
  const isOn = f.lightOn ?? true

  return (
    <div
      className="mt-1.5 pt-1.5 border-t border-stone-200/40 space-y-1.5"
      onClick={e => e.stopPropagation()}
    >
      {/* Başlık + açma/kapama */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-stone-600 flex items-center gap-1">
          💡 Aydınlatma
        </span>
        <button
          onClick={() => onChange({ lightOn: !isOn })}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
            isOn ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-500'
          }`}
          data-testid={`light-toggle-${f.id}`}
        >
          {isOn ? 'Açık' : 'Kapalı'}
        </button>
      </div>

      {/* Lümen + LED watt eşdeğeri */}
      <div>
        <div className="flex items-center justify-between text-[9px] text-stone-500 mb-0.5">
          <span>Parlaklık</span>
          <span className="font-mono text-stone-700">
            {curLumens} lm <span className="text-stone-400">· ~{watts} W LED</span>
          </span>
        </div>
        <input
          type="range"
          min={LUMEN_MIN}
          max={LUMEN_MAX}
          step={50}
          value={curLumens}
          onChange={e => onChange({ lumens: parseInt(e.target.value) })}
          className="w-full h-3 accent-amber-500 cursor-pointer"
          data-testid={`light-lumens-${f.id}`}
        />
      </div>

      {/* Kelvin renk sıcaklığı + renk önizleme */}
      <div>
        <div className="flex items-center justify-between text-[9px] text-stone-500 mb-0.5">
          <span>Renk Sıcaklığı</span>
          <span className="flex items-center gap-1 font-mono text-stone-700">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-stone-300"
              style={{ background: kelvinToCss(curKelvin) }}
            />
            {curKelvin} K
          </span>
        </div>
        <input
          type="range"
          min={KELVIN_MIN}
          max={KELVIN_MAX}
          step={100}
          value={curKelvin}
          onChange={e => onChange({ colorTempK: parseInt(e.target.value) })}
          className="w-full h-3 cursor-pointer"
          style={{
            background:
              'linear-gradient(to right, #ffb36a 0%, #ffd1a0 25%, #ffe8cc 50%, #ffffff 75%, #d0e4ff 100%)',
            borderRadius: 4,
          }}
          data-testid={`light-kelvin-${f.id}`}
        />
        <div className="text-[9px] text-stone-400 text-right mt-0.5">
          {kelvinLabel(curKelvin)}
        </div>
      </div>
    </div>
  )
}
