/**
 * CustomPlanWizard — kullanıcı oda tipi + adet + m² girer,
 * otomatik grid yerleşim algoritması ile LayoutData üretip importLayout'a verir.
 *
 * Akış:
 *   1. Kullanıcı "Oda Ekle" ile tip seç + m² gir
 *   2. Liste genişler — silme / düzenleme mümkün
 *   3. "Planı Oluştur" → autoLayout() → importLayout → canvas'ta plan hazır
 *   4. Kullanıcı sahnede odaları sürükleyip duzenler
 *
 * Yerleşim algoritması: row-based bin packing
 *   - Odalar m²'ye göre büyükten küçüğe sıralanır
 *   - Her oda için aspect ratio (banyo 0.7, balkon 0.4, diğer 1.0)
 *   - Maksimum satır genişliği: sqrt(totalArea * 2) ~= tipik ev genişliği
 *   - Satır dolunca alt satıra geç
 */

import { useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useToast } from '../../hooks/useToast'
import { ROOM_TYPES, ROOM_COLORS, MIN_DIM_CM, MAX_DIM_CM } from '../../types'
import type { Room, FurnitureItem, LayoutData, RoomType, FloorType } from '../../types'

interface CustomPlanWizardProps {
  open: boolean
  onClose: () => void
}

// Tek bir oda girdisi — form state: iki boyut (cm), m² otomatik hesaplanır
interface RoomEntry {
  id: string
  type: RoomType
  widthCm: number    // X ekseni (kısa kenar)
  lengthCm: number   // Z ekseni (uzun kenar)
}

/** m² hesabı — cm → m² */
function areaM2(r: { widthCm: number; lengthCm: number }): number {
  return (r.widthCm * r.lengthCm) / 10000
}

/** Oda tipine göre tipik default boyutlar (cm) */
function defaultDimsForType(type: RoomType): { widthCm: number; lengthCm: number } {
  switch (type) {
    case 'salon':   return { widthCm: 450, lengthCm: 550 }  // 24.75 m²
    case 'yatak':   return { widthCm: 340, lengthCm: 420 }  // 14.28 m²
    case 'mutfak':  return { widthCm: 280, lengthCm: 360 }  // 10.08 m²
    case 'banyo':   return { widthCm: 200, lengthCm: 250 }  // 5.00 m²
    case 'koridor': return { widthCm: 130, lengthCm: 500 }  //  6.50 m²
    case 'cocuk':   return { widthCm: 310, lengthCm: 380 }  // 11.78 m²
    case 'balkon':  return { widthCm: 150, lengthCm: 400 }  //  6.00 m²
    default:        return { widthCm: 300, lengthCm: 400 }
  }
}

// Varsayılan başlangıç: tipik 2+1 dağılımı
const DEFAULT_ROOMS: RoomEntry[] = [
  { id: 'r1', type: 'salon',   ...defaultDimsForType('salon')   },
  { id: 'r2', type: 'yatak',   ...defaultDimsForType('yatak')   },
  { id: 'r3', type: 'yatak',   widthCm: 300, lengthCm: 380 },  // daha küçük 2. yatak
  { id: 'r4', type: 'mutfak',  ...defaultDimsForType('mutfak')  },
  { id: 'r5', type: 'banyo',   ...defaultDimsForType('banyo')   },
  { id: 'r6', type: 'koridor', ...defaultDimsForType('koridor') },
]

/** Otomatik grid yerleşim — row-based bin packing
 *  Kullanıcı direkt width/length girdiği için aspect ratio hesabı yok. */
function autoLayout(entries: RoomEntry[]): LayoutData {
  // Alan büyükten küçüğe sırala (büyük odalar önce yerleşsin)
  const sorted = [...entries].sort((a, b) => areaM2(b) - areaM2(a))

  // Her oda için metre cinsinden boyut
  const roomsWithDims = sorted.map(r => ({
    ...r,
    w: r.widthCm / 100,   // metre
    l: r.lengthCm / 100,
  }))

  // Hedef satır genişliği: tipik ev ~10m geniş. Toplam alanın kareköküne yakın.
  const totalArea = entries.reduce((sum, r) => sum + areaM2(r), 0)
  const targetRowWidth = Math.max(8, Math.sqrt(totalArea * 2))

  // Satırlara pack
  type Row = { width: number; height: number; rooms: typeof roomsWithDims }
  const rows: Row[] = []
  let currentRow: Row = { width: 0, height: 0, rooms: [] }
  for (const room of roomsWithDims) {
    if (currentRow.width + room.w > targetRowWidth && currentRow.rooms.length > 0) {
      rows.push(currentRow)
      currentRow = { width: 0, height: 0, rooms: [] }
    }
    currentRow.rooms.push(room)
    currentRow.width += room.w
    currentRow.height = Math.max(currentRow.height, room.l)
  }
  if (currentRow.rooms.length > 0) rows.push(currentRow)

  // Konumlandır — sol üstten başla (0, 0)
  const roomObjects: Room[] = []
  let z = 0
  let colorIdx = 0
  for (const row of rows) {
    let x = 0
    for (const r of row.rooms) {
      const safeW = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, r.widthCm))
      const safeL = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, r.lengthCm))
      const centerX = x + safeW / 200
      const centerZ = z + safeL / 200
      const floorType: FloorType = (r.type === 'banyo' || r.type === 'mutfak' || r.type === 'balkon')
        ? 'fayans' : 'parke'
      roomObjects.push({
        id: `custom-${r.id}-${Date.now()}`,
        type: r.type,
        widthCm: safeW,
        lengthCm: safeL,
        position: [centerX, centerZ],
        rotation: 0,
        color: ROOM_COLORS[colorIdx % ROOM_COLORS.length],
        wallColor: '#e3ddd4',
        wallColorOuter: '#c8c0b4',
        floorType,
        openings: [],
        removedWalls: [],
      })
      x += safeW / 100
      colorIdx++
    }
    z += row.height
  }

  // Planın merkezini (0,0)'a çek — sahne merkezli olsun
  const xs = roomObjects.map(r => r.position[0])
  const zs = roomObjects.map(r => r.position[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2
  for (const r of roomObjects) {
    r.position = [r.position[0] - cx, r.position[1] - cz]
  }

  const furniture: FurnitureItem[] = []  // mobilya boş — kullanıcı ekler
  return { version: 1, rooms: roomObjects, furniture }
}

export default function CustomPlanWizard({ open, onClose }: CustomPlanWizardProps) {
  const importLayout = useDesignStore(s => s.importLayout)
  const toast = useToast()
  const [rooms, setRooms] = useState<RoomEntry[]>(DEFAULT_ROOMS)

  if (!open) return null

  const addRoom = () => {
    const id = `r${Date.now()}`
    setRooms([...rooms, { id, type: 'yatak', ...defaultDimsForType('yatak') }])
  }

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id))
  }

  const updateRoom = (id: string, patch: Partial<RoomEntry>) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const handleCreate = () => {
    if (rooms.length === 0) {
      toast.error('En az 1 oda eklemelisiniz')
      return
    }
    for (const r of rooms) {
      if (!isFinite(r.widthCm) || r.widthCm < MIN_DIM_CM || r.widthCm > MAX_DIM_CM ||
          !isFinite(r.lengthCm) || r.lengthCm < MIN_DIM_CM || r.lengthCm > MAX_DIM_CM) {
        toast.error(`Geçersiz boyut (${MIN_DIM_CM}-${MAX_DIM_CM} cm arası olmalı)`)
        return
      }
    }
    const layout = autoLayout(rooms)
    importLayout(layout)
    toast.success(`${rooms.length} odalı özel plan oluşturuldu (toplam ${totalArea.toFixed(1)} m²)`)
    onClose()
  }

  const totalArea = rooms.reduce((sum, r) => sum + areaM2(r), 0)

  return (
    <div
      className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="custom-plan-wizard"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-300/50 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-100 via-sky-50 to-amber-50 px-5 py-4 border-b border-stone-200/50 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-bold text-stone-800 flex items-center gap-2">
                ✨ Özel Plan Oluştur
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                Odalarını ve m² değerlerini gir, plan otomatik hazırlansın. Sonra sahnede düzenleyebilirsin.
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 text-xl cursor-pointer leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-stone-100"
              aria-label="Kapat"
            >✕</button>
          </div>
        </div>

        {/* Oda listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              Henüz oda eklenmedi. Aşağıdan "+ Oda Ekle" ile başlayın.
            </div>
          )}
          {rooms.map((r, idx) => {
            const meta = ROOM_TYPES.find(t => t.type === r.type)
            const area = areaM2(r)
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl p-2.5"
              >
                <span className="text-lg flex-shrink-0 w-6 text-center">{meta?.icon ?? '🏠'}</span>
                {/* Tip seçici */}
                <select
                  value={r.type}
                  onChange={e => {
                    const newType = e.target.value as RoomType
                    // Tip değişince varsayılan boyutları öner
                    updateRoom(r.id, { type: newType, ...defaultDimsForType(newType) })
                  }}
                  className="flex-1 min-w-0 border border-stone-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  data-testid={`room-type-${idx}`}
                >
                  {ROOM_TYPES.map(t => (
                    <option key={t.type} value={t.type}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
                {/* Boyut input'ları: width × length (cm) */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="number"
                    min={MIN_DIM_CM}
                    max={MAX_DIM_CM}
                    step={10}
                    value={r.widthCm}
                    onChange={e => updateRoom(r.id, { widthCm: parseInt(e.target.value) || 0 })}
                    className="w-16 border border-stone-300 rounded-lg px-1.5 py-1.5 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    data-testid={`room-width-${idx}`}
                    title="Genişlik (cm)"
                  />
                  <span className="text-stone-400 text-xs">×</span>
                  <input
                    type="number"
                    min={MIN_DIM_CM}
                    max={MAX_DIM_CM}
                    step={10}
                    value={r.lengthCm}
                    onChange={e => updateRoom(r.id, { lengthCm: parseInt(e.target.value) || 0 })}
                    className="w-16 border border-stone-300 rounded-lg px-1.5 py-1.5 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    data-testid={`room-length-${idx}`}
                    title="Uzunluk (cm)"
                  />
                  <span className="text-[9px] text-stone-400 font-semibold">cm</span>
                </div>
                {/* Otomatik m² hesabı (read-only badge) */}
                <div
                  className="flex-shrink-0 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-mono font-bold text-amber-700 min-w-[3.5rem] text-center"
                  title="Otomatik m² hesabı"
                >
                  {area.toFixed(1)} m²
                </div>
                {/* Sil */}
                <button
                  onClick={() => removeRoom(r.id)}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                  title="Odayı sil"
                  aria-label="Odayı sil"
                >✕</button>
              </div>
            )
          })}

          {/* Ekle butonu */}
          <button
            onClick={addRoom}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50 text-stone-500 hover:text-amber-700 text-xs font-semibold transition-all cursor-pointer"
            data-testid="add-room"
          >
            <span className="text-lg">+</span> Oda Ekle
          </button>

          {/* Hızlı şablon (preset doldur) */}
          <div className="border-t border-stone-200/50 pt-3 mt-3">
            <div className="text-[10px] text-stone-500 mb-1.5 font-semibold">⚡ Hızlı Başlangıç</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setRooms([
                  { id: 'q1', type: 'salon',  widthCm: 400, lengthCm: 500 },
                  { id: 'q2', type: 'yatak',  widthCm: 320, lengthCm: 380 },
                  { id: 'q3', type: 'mutfak', widthCm: 250, lengthCm: 320 },
                  { id: 'q4', type: 'banyo',  widthCm: 180, lengthCm: 220 },
                ])}
                className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
              >
                1+1 Standart
              </button>
              <button
                onClick={() => setRooms([...DEFAULT_ROOMS])}
                className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
              >
                2+1 Standart
              </button>
              <button
                onClick={() => setRooms([
                  { id: 'q1', type: 'salon',   widthCm: 500, lengthCm: 600 },
                  { id: 'q2', type: 'yatak',   widthCm: 380, lengthCm: 480 },
                  { id: 'q3', type: 'yatak',   widthCm: 320, lengthCm: 380 },
                  { id: 'q4', type: 'cocuk',   widthCm: 310, lengthCm: 380 },
                  { id: 'q5', type: 'mutfak',  widthCm: 300, lengthCm: 400 },
                  { id: 'q6', type: 'banyo',   widthCm: 200, lengthCm: 250 },
                  { id: 'q7', type: 'banyo',   widthCm: 180, lengthCm: 220 },
                  { id: 'q8', type: 'koridor', widthCm: 130, lengthCm: 400 },
                  { id: 'q9', type: 'balkon',  widthCm: 150, lengthCm: 500 },
                ])}
                className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
              >
                3+1 Detaylı
              </button>
              <button
                onClick={() => setRooms([])}
                className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-red-100 hover:text-red-700 text-stone-600 font-semibold cursor-pointer transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200/60 bg-stone-50/60 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-stone-600">
            <span className="font-semibold">{rooms.length}</span> oda · Toplam{' '}
            <span className="font-mono font-bold text-stone-800">{totalArea.toFixed(1)} m²</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={rooms.length === 0}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="create-plan"
            >
              ✨ Planı Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
