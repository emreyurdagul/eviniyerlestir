import { useState, useRef, useEffect, useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'
import type { FurnitureConfig, FurnitureType } from '../../types'
import SearchBox from './SearchBox'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  oturma:     { label: 'Oturma Odası', icon: '🛋' },
  yatak:      { label: 'Yatak Odası',  icon: '🛏' },
  yemek:      { label: 'Yemek Odası',  icon: '🍽' },
  mutfak:     { label: 'Mutfak',       icon: '🍳' },
  banyo:      { label: 'Banyo',        icon: '🚿' },
  calisma:    { label: 'Çalışma',      icon: '💻' },
  cocuk:      { label: 'Çocuk',        icon: '🧸' },
  depolama:   { label: 'Depolama',     icon: '📦' },
  aydinlatma: { label: 'Aydınlatma',   icon: '💡' },
  dekor:      { label: 'Dekor',        icon: '🌿' },
  bahce:      { label: 'Bahçe',        icon: '🌳' },
  yapisal:    { label: 'Yapısal',      icon: '🪜' },
}

// Modül düzeyinde sabit — useMemo bağımlılığı olarak temiz (render'a göre
// yeniden oluşturulmuyor, eslint exhaustive-deps ile uyumlu).
const CAT_ORDER = Object.keys(CATEGORY_META)

export default function Toolbar() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'room' | 'furniture'>('room')
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['oturma', 'mutfak']))
  const [variantPopup, setVariantPopup] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const addRoom = useDesignStore(s => s.addRoom)
  const addFurniture = useDesignStore(s => s.addFurniture)
  const addCustomFurniture = useDesignStore(s => s.addCustomFurniture)
  const defaultVariants = useDesignStore(s => s.defaultVariants)
  const setDefaultVariant = useDesignStore(s => s.setDefaultVariant)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const name = file.name.replace(/\.(glb|gltf)$/i, '')
    addCustomFurniture(name, url)
    e.target.value = ''
  }

  const toggleCat = (cat: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Arama filtresi — tip, etiket veya varyant adlarında eşleşme.
  // matches() fonksiyonu useMemo içine taşındı; böylece dışarıdaki her
  // render'da yeni referansla oluşup memo'yu gereksiz geçersiz kılmıyor,
  // exhaustive-deps kuralı da tek gerçek bağımlılığı (normalized) görüyor.
  const normalized = search.trim().toLowerCase()

  const byCategory = useMemo(() => {
    const matches = (c: FurnitureConfig): boolean => {
      if (!normalized) return true
      if (c.label.toLowerCase().includes(normalized)) return true
      if (c.type.toLowerCase().includes(normalized)) return true
      if (c.variants?.some(v => v.label.toLowerCase().includes(normalized))) return true
      return false
    }
    return CAT_ORDER.map(cat => ({
      cat,
      meta: CATEGORY_META[cat],
      items: FURNITURE_CATALOG.filter(c => c.category === cat && matches(c)),
    })).filter(g => g.items.length > 0)
  }, [normalized])

  const totalMatches = byCategory.reduce((a, g) => a + g.items.length, 0)

  // Popover dışına tıklamayla kapat
  useEffect(() => {
    if (!variantPopup) return
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setVariantPopup(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [variantPopup])

  // Varyantlı bir mobilya için varsayılan label etiketi (seçilen varyant)
  const activeVariantId = (c: FurnitureConfig): string | undefined =>
    c.variants ? (defaultVariants[c.type] ?? c.variants[0].id) : undefined

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10" data-testid="toolbar">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-3xl text-xs font-bold text-stone-800 border border-stone-300/40 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        data-testid="toolbar-toggle"
      >
        {open ? '✕ Kapat' : '➕ Ekle'}
      </button>

      {open && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-300/30 p-2.5 w-[min(88vw,18rem)] sm:w-48 relative max-h-[70vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
          {/* Tabs */}
          <div className="flex gap-0.5 mb-2 bg-stone-100/60 rounded-xl p-0.5">
            <button
              onClick={() => setTab('room')}
              className={`flex-1 py-1.5 px-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                tab === 'room' ? 'bg-amber-100/60 text-amber-800' : 'text-stone-500 hover:text-stone-700'
              }`}
              data-testid="toolbar-tab-room"
            >
              🏠 Oda
            </button>
            <button
              onClick={() => setTab('furniture')}
              className={`flex-1 py-1.5 px-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                tab === 'furniture' ? 'bg-amber-100/60 text-amber-800' : 'text-stone-500 hover:text-stone-700'
              }`}
              data-testid="toolbar-tab-furniture"
            >
              🛋 Mobilya
            </button>
          </div>

          {/* Oda */}
          {tab === 'room' && ROOM_TYPES.map(c => (
            <button
              key={c.type}
              onClick={() => addRoom(c.type)}
              className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 bg-amber-50/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs font-semibold text-stone-800 hover:translate-x-0.5 transition-transform text-left"
              data-testid={`toolbar-room-${c.type}`}
            >
              <span className="text-sm">{c.icon}</span> {c.label}
            </button>
          ))}

          {/* Mobilya kategorileri */}
          {tab === 'furniture' && (
            <>
              {/* Arama kutusu */}
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Mobilya ara..."
                className="mb-2"
                testId="toolbar-search"
              />

              {/* Arama sonuç özeti */}
              {normalized && (
                <div className="text-[9px] text-stone-500 mb-1 px-1">
                  {totalMatches > 0 ? `${totalMatches} sonuç` : 'Sonuç bulunamadı'}
                </div>
              )}

              {byCategory.map(({ cat, meta, items }) => {
                const forceOpen = !!normalized  // Arama aktifse kategorileri zorla aç
                const isOpen = forceOpen || openCats.has(cat)
                return (
                <div key={cat}>
                  <button
                    onClick={() => !forceOpen && toggleCat(cat)}
                    className="flex items-center justify-between w-full py-1 px-1 mb-0.5 text-[10px] font-bold text-stone-600 hover:text-stone-800 transition-colors cursor-pointer"
                    data-testid={`toolbar-cat-${cat}`}
                    title={`${meta.label}: ${items.map(i => i.label).join(', ')}`}
                  >
                    <span>{meta.icon} {meta.label}</span>
                    <span className="text-stone-400">{isOpen ? '▴' : '▾'}</span>
                  </button>

                  {isOpen && items.map(c => {
                    const hasVariants = !!c.variants && c.variants.length > 1
                    const activeVid = activeVariantId(c)
                    const activeVariant = c.variants?.find(v => v.id === activeVid)
                    return (
                      <div key={c.type} className="flex items-stretch gap-0.5 mb-1 ml-1">
                        {/* Ana buton — varsayılan varyantla ekler */}
                        <button
                          onClick={() => addFurniture(c.type as FurnitureType)}
                          className="flex-1 flex items-center gap-1.5 py-1.5 px-2 bg-amber-50/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs font-semibold text-stone-800 hover:translate-x-0.5 transition-transform text-left"
                          data-testid={`toolbar-furn-${c.type}`}
                          title={activeVariant ? `${c.label} — ${activeVariant.label}` : c.label}
                        >
                          <span className="text-sm shrink-0">{c.icon}</span>
                          <span className="truncate flex-1 min-w-0">{c.label}</span>
                          {activeVariant && (
                            <span className="text-[9px] text-stone-500 shrink-0 font-normal">
                              {activeVariant.label}
                            </span>
                          )}
                        </button>
                        {/* Varyant ok tuşu */}
                        {hasVariants && (
                          <button
                            onClick={() => setVariantPopup(c.type)}
                            className="px-3 sm:px-1.5 bg-amber-100/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs sm:text-[10px] font-bold text-amber-800 hover:bg-amber-200 transition-colors min-w-[36px] sm:min-w-0"
                            title="Varyantlar"
                            data-testid={`toolbar-furn-${c.type}-variants`}
                          >
                            ▾
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

              <div className="border-t border-stone-200/30 my-1.5" />
              <button
                onClick={() => modelInputRef.current?.click()}
                className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 bg-blue-50/80 border border-blue-300/40 rounded-lg cursor-pointer text-xs font-semibold text-blue-800 hover:translate-x-0.5 transition-transform text-left"
                data-testid="toolbar-upload-model"
              >
                <span className="text-sm">📦</span> 3D Model Yükle (.glb)
              </button>
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleModelUpload}
                className="hidden"
              />
            </>
          )}

          {/* Varyant popover */}
          {variantPopup && (() => {
            const cfg = FURNITURE_CATALOG.find(c => c.type === variantPopup)
            if (!cfg || !cfg.variants) return null
            const currentDefault = defaultVariants[cfg.type] ?? cfg.variants[0].id
            return (
              <div
                ref={popupRef}
                className="fixed inset-x-4 bottom-4 sm:absolute sm:inset-auto sm:left-[105%] sm:top-8 sm:bottom-auto bg-white rounded-xl shadow-2xl border border-stone-300/60 p-2 z-50 w-auto sm:w-60 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto"
                data-testid={`variant-popup-${cfg.type}`}
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-xs font-bold text-stone-800">{cfg.icon} {cfg.label}</div>
                  <button
                    onClick={() => setVariantPopup(null)}
                    className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer leading-none"
                  >✕</button>
                </div>
                <div className="text-[9px] text-stone-500 px-1 mb-1.5 leading-relaxed">
                  Bir varyant seçip "Ekle" ile sahneye ekleyebilir veya "Varsayılan" ile o tipin
                  varsayılan stilini değiştirebilirsiniz.
                </div>
                {cfg.variants.map(v => {
                  const isDefault = currentDefault === v.id
                  return (
                    <div
                      key={v.id}
                      className={`p-2 mb-1 rounded-lg border transition-all ${
                        isDefault ? 'bg-amber-50 border-amber-400/60' : 'bg-stone-50 border-stone-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{v.icon ?? cfg.icon}</span>
                        <span className="text-xs font-bold text-stone-800">{v.label}</span>
                        {isDefault && <span className="text-[9px] text-amber-700 font-bold ml-auto">Varsayılan</span>}
                      </div>
                      {v.description && (
                        <div className="text-[10px] text-stone-500 mb-1.5 leading-tight">{v.description}</div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => { addFurniture(cfg.type as FurnitureType, v.id); setVariantPopup(null) }}
                          className="flex-1 py-1 rounded bg-amber-500 text-white text-[10px] font-bold cursor-pointer hover:bg-amber-600 transition-colors"
                          data-testid={`variant-add-${cfg.type}-${v.id}`}
                        >+ Ekle</button>
                        <button
                          onClick={() => setDefaultVariant(cfg.type, v.id)}
                          disabled={isDefault}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                            isDefault
                              ? 'bg-stone-100 text-stone-400 cursor-default'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer'
                          }`}
                          data-testid={`variant-default-${cfg.type}-${v.id}`}
                        >{isDefault ? '✓' : 'Varsayılan'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          <div className="text-[9px] text-stone-400 mt-1 text-center leading-snug">
            Tıkla → ekle → sürükle
          </div>
        </div>
      )}
    </div>
  )
}
