/**
 * BottomBar — ekranın altındaki ana komut çubuğu.
 *
 * İçerik:
 *   - Üstte koşullu bilgi şeritleri (BottomBarInfoStrips'te toplandı)
 *   - Hızlı eylem butonları (undo/redo, rotate, draw)
 *   - 4 grup dropdown menüsü: Araçlar / Görünüm / Ayarlar / Dosya
 *
 * Önceki halinde ~590 satırdı; dosya işlemleri useFileOperations hook'una,
 * bilgi şeritleri BottomBarInfoStrips bileşenine taşındı. Kalan: menü
 * dropdown'ları + menü state yönetimi.
 */

import { useRef, useState, useEffect } from 'react'
import { useDesignStore } from '../../store/designStore'
import { pdfToImageUrl } from '../../services/pdfImport'
import { useToast } from '../../hooks/useToast'
import { useFileOperations } from '../../hooks/useFileOperations'
import BottomBarInfoStrips from './BottomBarInfoStrips'

type MenuKey = 'tools' | 'view' | 'file' | 'settings' | null

export default function BottomBar({ onShow2D, onShowPresets }: { onShow2D?: () => void; onShowPresets?: () => void }) {
  const selection = useDesignStore(s => s.selection)
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const isTopView = useDesignStore(s => s.isTopView)
  const setTopView = useDesignStore(s => s.setTopView)
  const showDimensions = useDesignStore(s => s.showDimensions)
  const toggleDimensions = useDesignStore(s => s.toggleDimensions)
  const showCompass = useDesignStore(s => s.showCompass)
  const toggleCompass = useDesignStore(s => s.toggleCompass)
  const isDrawing = useDesignStore(s => s.isDrawing)
  const setDrawing = useDesignStore(s => s.setDrawing)
  const blueprintUrl = useDesignStore(s => s.blueprintUrl)
  const setBlueprint = useDesignStore(s => s.setBlueprint)
  const ceilingHeight = useDesignStore(s => s.ceilingHeight)
  const setCeilingHeight = useDesignStore(s => s.setCeilingHeight)
  const ambientIntensity = useDesignStore(s => s.ambientIntensity)
  const setAmbientIntensity = useDesignStore(s => s.setAmbientIntensity)
  const preventRoomOverlap = useDesignStore(s => s.preventRoomOverlap)
  const setPreventRoomOverlap = useDesignStore(s => s.setPreventRoomOverlap)
  const detailedLighting = useDesignStore(s => s.detailedLighting)
  const setDetailedLighting = useDesignStore(s => s.setDetailedLighting)
  const hdriEnvironment = useDesignStore(s => s.hdriEnvironment)
  const setHdriEnvironment = useDesignStore(s => s.setHdriEnvironment)

  const [openMenu, setOpenMenu] = useState<MenuKey>(null)
  const toast = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const blueprintInputRef = useRef<HTMLInputElement>(null)

  const {
    fileInputRef,
    handleSave,
    handleLoad,
    handleFileChange,
    handleExportPng,
    handleShareLink,
    handleAiBlueprint,
  } = useFileOperations()

  const hasSelection = selection.kind !== null && selection.id !== null

  // Menü dışına tıklanınca kapat
  useEffect(() => {
    if (!openMenu) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  const handleRotate = () => {
    if (selection.kind === 'room' && selection.id) {
      const r = rooms.find(r => r.id === selection.id)
      if (r) updateRoom(r.id, { rotation: r.rotation + Math.PI / 2 })
    }
    if (selection.kind === 'furniture' && selection.id) {
      const f = furniture.find(f => f.id === selection.id)
      if (f) updateFurniture(f.id, { rotation: f.rotation + Math.PI / 2 })
    }
  }

  // Ana bar buton stili (kısa, ikon odaklı)
  const groupBtn = (active = false) =>
    `flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[11px] font-bold cursor-pointer shadow-md hover:-translate-y-0.5 transition-transform whitespace-nowrap border backdrop-blur-sm ${
      active
        ? 'text-amber-800 bg-amber-100/90 border-amber-400/60'
        : 'text-stone-800 bg-white/95 border-stone-300/30'
    }`

  // Dropdown içi action stili
  const itemBtn = (active = false) =>
    `flex items-center gap-2 w-full py-1.5 px-3 text-[12px] font-semibold cursor-pointer rounded-lg transition-colors text-left ${
      active ? 'bg-amber-100/80 text-amber-800' : 'text-stone-700 hover:bg-stone-100'
    }`

  const toggleMenu = (k: MenuKey) => setOpenMenu(m => m === k ? null : k)

  return (
    <>
      <div
        ref={containerRef}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none max-w-[95vw]"
        data-testid="bottom-area"
      >
        {/* ── Bilgi Şeritleri (üstte) ── */}
        <BottomBarInfoStrips onAiBlueprint={handleAiBlueprint} />

        {/* ── Ana bar: grup butonları + quick actions ── */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-center relative">
          {/* Hızlı undo/redo (her zaman görünür) */}
          <button
            onClick={() => useDesignStore.temporal.getState().undo()}
            className={groupBtn()}
            title="Geri Al (Ctrl+Z)"
            data-testid="btn-undo"
          >↩</button>
          <button
            onClick={() => useDesignStore.temporal.getState().redo()}
            className={groupBtn()}
            title="İleri Al (Ctrl+Y)"
            data-testid="btn-redo"
          >↪</button>

          {/* Hızlı: seçili öğe için döndürme */}
          {hasSelection && (
            <button onClick={handleRotate} className={groupBtn(true)} title="Döndür" data-testid="btn-rotate">
              ↻
            </button>
          )}

          {/* Hızlı: çizim */}
          <button
            onClick={() => setDrawing(!isDrawing)}
            className={groupBtn(isDrawing)}
            title="Çizim modu"
            data-testid="btn-draw"
          >{isDrawing ? '✕' : '✏'}</button>

          {/* ── Grup 1: Araçlar ── */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('tools')}
              className={groupBtn(openMenu === 'tools')}
              data-testid="menu-tools"
              title="Araçlar"
            >
              🛠 <span className="hidden sm:inline">Araçlar</span>
              <span className="text-[9px] opacity-60">{openMenu === 'tools' ? '▾' : '▸'}</span>
            </button>
            {openMenu === 'tools' && (
              <div className="absolute bottom-full mb-1.5 left-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-[min(88vw,13rem)] z-30">
                <button
                  onClick={() => { setDrawing(!isDrawing); setOpenMenu(null) }}
                  className={itemBtn(isDrawing)}
                >
                  <span className="w-5">✏</span>
                  {isDrawing ? 'Çizimi Bitir' : 'Oda Çiz'}
                </button>
                {hasSelection && (
                  <button onClick={() => { handleRotate(); setOpenMenu(null) }} className={itemBtn()}>
                    <span className="w-5">↻</span>
                    Döndür (+90°)
                    <span className="ml-auto text-[9px] text-stone-400">R</span>
                  </button>
                )}
                <div className="border-t border-stone-200/50 my-1" />
                <button
                  onClick={() => { useDesignStore.temporal.getState().undo(); setOpenMenu(null) }}
                  className={itemBtn()}
                >
                  <span className="w-5">↩</span> Geri Al
                  <span className="ml-auto text-[9px] text-stone-400">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => { useDesignStore.temporal.getState().redo(); setOpenMenu(null) }}
                  className={itemBtn()}
                >
                  <span className="w-5">↪</span> İleri Al
                  <span className="ml-auto text-[9px] text-stone-400">Ctrl+Y</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Grup 2: Görünüm ── */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('view')}
              className={groupBtn(openMenu === 'view' || isTopView || showCompass || showDimensions)}
              data-testid="menu-view"
              title="Görünüm"
            >
              👁 <span className="hidden sm:inline">Görünüm</span>
              <span className="text-[9px] opacity-60">{openMenu === 'view' ? '▾' : '▸'}</span>
            </button>
            {openMenu === 'view' && (
              <div className="absolute bottom-full mb-1.5 left-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-[min(88vw,13rem)] z-30">
                <button
                  onClick={() => { setTopView(!isTopView); setOpenMenu(null) }}
                  className={itemBtn(isTopView)}
                  data-testid="btn-view-toggle"
                >
                  <span className="w-5">{isTopView ? '🗺' : '🔭'}</span>
                  {isTopView ? 'Üstten Görünüm' : '3D Görünüm'}
                </button>
                <button
                  onClick={() => { toggleCompass(); setOpenMenu(null) }}
                  className={itemBtn(showCompass)}
                  data-testid="btn-compass"
                >
                  <span className="w-5">🧭</span> Pusula / Güneş
                </button>
                <button
                  onClick={() => { toggleDimensions(); setOpenMenu(null) }}
                  className={itemBtn(showDimensions)}
                  data-testid="btn-dimensions"
                >
                  <span className="w-5">📏</span> Ölçüler
                </button>
                {onShow2D && (
                  <>
                    <div className="border-t border-stone-200/50 my-1" />
                    <button
                      onClick={() => { onShow2D(); setOpenMenu(null) }}
                      className={itemBtn()}
                      data-testid="btn-2d"
                    >
                      <span className="w-5">📐</span> 2D Plan Penceresi
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Grup 3b: Genel Ayarlar ── */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('settings')}
              className={groupBtn(openMenu === 'settings')}
              data-testid="menu-settings"
              title="Genel Ayarlar"
            >
              ⚙ <span className="hidden sm:inline">Ayarlar</span>
              <span className="text-[9px] opacity-60">{openMenu === 'settings' ? '▾' : '▸'}</span>
            </button>
            {openMenu === 'settings' && (
              <div className="absolute bottom-full mb-1.5 right-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-3 w-[min(90vw,16rem)] z-30">
                <div className="text-[11px] font-bold text-stone-700 mb-2 flex items-center gap-1">
                  ⚙ Genel Ayarlar
                </div>

                {/* Kat yüksekliği */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-stone-600 font-semibold">
                      🏠 Kat Yüksekliği
                    </label>
                    <span className="text-[10px] font-mono text-stone-700 font-bold">
                      {ceilingHeight.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={4.0}
                    step={0.05}
                    value={ceilingHeight}
                    onChange={e => setCeilingHeight(parseFloat(e.target.value))}
                    className="w-full h-3 accent-amber-500 cursor-pointer"
                    data-testid="setting-ceiling-height"
                  />
                  <div className="flex justify-between text-[8px] text-stone-400 mt-0.5">
                    <span>2.00 m</span>
                    <span>Standart (2.65 m)</span>
                    <span>4.00 m</span>
                  </div>
                </div>

                {/* Ortam ışığı */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-stone-600 font-semibold">
                      💡 Ortam Aydınlatması
                    </label>
                    <span className="text-[10px] font-mono text-stone-700 font-bold">
                      {Math.round(ambientIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(ambientIntensity * 100)}
                    onChange={e => setAmbientIntensity(parseInt(e.target.value) / 100)}
                    className="w-full h-3 accent-amber-500 cursor-pointer"
                    data-testid="setting-ambient-intensity"
                  />
                  <div className="text-[8px] text-stone-400 mt-0.5 leading-tight">
                    Sahnedeki genel gün ışığı şiddeti. Düşürüp lambaları açarak gece etkisi elde edebilirsiniz.
                  </div>
                </div>

                {/* Oda çakışma koruması */}
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div
                      onClick={() => setPreventRoomOverlap(!preventRoomOverlap)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${preventRoomOverlap ? 'bg-amber-500' : 'bg-stone-300'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${preventRoomOverlap ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[10px] text-stone-600 font-semibold group-hover:text-stone-800 transition-colors">
                      🚫 Oda Çakışmasını Önle
                    </span>
                  </label>
                  <div className="text-[9px] text-stone-400 mt-0.5 leading-tight ml-10">
                    Odalar sürüklenirken birbirine geçmez.
                  </div>
                </div>

                {/* Detaylı ışık analizi (SSAO + bounce lights) */}
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div
                      onClick={() => setDetailedLighting(!detailedLighting)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${detailedLighting ? 'bg-amber-500' : 'bg-stone-300'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${detailedLighting ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[10px] text-stone-600 font-semibold group-hover:text-stone-800 transition-colors">
                      ✨ Detaylı Işık Analizi
                    </span>
                  </label>
                  <div className="text-[9px] text-stone-400 mt-0.5 leading-tight ml-10">
                    Gölgelere doğal yumuşaklık + dolaylı aydınlatma ekler. GPU'ya biraz yük bindirir.
                  </div>
                </div>

                {/* HDRI ortam haritası (opt-in alt toggle, sadece detailedLighting açıkken aktif) */}
                <div className={`mb-2 ml-4 border-l-2 border-stone-200/50 pl-3 transition-opacity ${detailedLighting ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div
                      onClick={() => detailedLighting && setHdriEnvironment(!hdriEnvironment)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${hdriEnvironment && detailedLighting ? 'bg-amber-500' : 'bg-stone-300'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${hdriEnvironment && detailedLighting ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[10px] text-stone-600 font-semibold group-hover:text-stone-800 transition-colors">
                      🌇 HDRI Ortam Haritası
                    </span>
                  </label>
                  <div className="text-[9px] text-stone-400 mt-0.5 leading-tight ml-10">
                    İç mekân / gece sahneleri için ekstra ortam ışığı. Güneş yoğunluğu otomatik düşer.
                  </div>
                </div>

                <div className="border-t border-stone-200/50 pt-2 text-[9px] text-stone-500 leading-tight">
                  Bu ayarlar oturumlar arası kaydedilir.
                </div>
              </div>
            )}
          </div>

          {/* ── Grup 3: Dosya ── */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('file')}
              className={groupBtn(openMenu === 'file')}
              data-testid="menu-file"
              title="Dosya"
            >
              📁 <span className="hidden sm:inline">Dosya</span>
              <span className="text-[9px] opacity-60">{openMenu === 'file' ? '▾' : '▸'}</span>
            </button>
            {openMenu === 'file' && (
              <div className="absolute bottom-full mb-1.5 right-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-[min(90vw,14rem)] z-30">
                {onShowPresets && (
                  <button
                    onClick={() => { onShowPresets(); setOpenMenu(null) }}
                    className={itemBtn()}
                    data-testid="btn-presets"
                  >
                    <span className="w-5">📋</span> Hazır Şablonlardan Seç
                  </button>
                )}
                <div className="border-t border-stone-200/50 my-1" />
                <button onClick={() => { handleSave(); setOpenMenu(null) }} className={itemBtn()} data-testid="btn-save">
                  <span className="w-5">💾</span> Planı Kaydet (.json)
                </button>
                <button onClick={() => { handleLoad(); setOpenMenu(null) }} className={itemBtn()} data-testid="btn-load">
                  <span className="w-5">📂</span> Planı Yükle
                </button>
                <div className="border-t border-stone-200/50 my-1" />
                <button onClick={() => { handleShareLink(); setOpenMenu(null) }} className={itemBtn()} data-testid="btn-share-link">
                  <span className="w-5">🔗</span> Paylaşılabilir Link
                </button>
                <button onClick={() => { handleExportPng(); setOpenMenu(null) }} className={itemBtn()} data-testid="btn-export-png">
                  <span className="w-5">📸</span> PNG Dışa Aktar
                </button>
                <div className="border-t border-stone-200/50 my-1" />
                <button
                  onClick={() => { blueprintInputRef.current?.click(); setOpenMenu(null) }}
                  className={itemBtn(!!blueprintUrl)}
                  data-testid="btn-blueprint"
                >
                  <span className="w-5">🗺</span>
                  {blueprintUrl ? 'Krokiyi Değiştir' : 'Kroki / PDF Yükle'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gizli input'lar */}
      <input
        ref={blueprintInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              const imageUrl = await pdfToImageUrl(file)
              setBlueprint(imageUrl)
            } else {
              setBlueprint(URL.createObjectURL(file))
            }
          } catch (err) {
            console.error('Blueprint import error:', err)
            toast.error('Dosya okunamadı: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
          }
          e.target.value = ''
        }}
        className="hidden"
        data-testid="blueprint-input"
      />
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" data-testid="file-input" />
    </>
  )
}
