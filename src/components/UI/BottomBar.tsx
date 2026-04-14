import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'
import { exportToJSON, downloadFile, readFile, validateAndParse } from '../../services/serialization'
import { pdfToImageUrl } from '../../services/pdfImport'
import { parseBlueprint } from '../../services/ai/client'

type MenuKey = 'tools' | 'view' | 'file' | null

export default function BottomBar({ onShow2D }: { onShow2D?: () => void }) {
  const { i18n } = useTranslation()
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
  const compassAngle = useDesignStore(s => s.compassAngle)
  const setCompassAngle = useDesignStore(s => s.setCompassAngle)
  const sunHour = useDesignStore(s => s.sunHour)
  const setSunHour = useDesignStore(s => s.setSunHour)
  const sunMonth = useDesignStore(s => s.sunMonth)
  const setSunMonth = useDesignStore(s => s.setSunMonth)
  const isDrawing = useDesignStore(s => s.isDrawing)
  const setDrawing = useDesignStore(s => s.setDrawing)
  const drawPoints = useDesignStore(s => s.drawPoints)
  const clearDrawPoints = useDesignStore(s => s.clearDrawPoints)
  const blueprintUrl = useDesignStore(s => s.blueprintUrl)
  const setBlueprint = useDesignStore(s => s.setBlueprint)
  const blueprintScale = useDesignStore(s => s.blueprintScale)
  const setBlueprintScale = useDesignStore(s => s.setBlueprintScale)
  const blueprintOpacity = useDesignStore(s => s.blueprintOpacity)
  const setBlueprintOpacity = useDesignStore(s => s.setBlueprintOpacity)
  const exportLayout = useDesignStore(s => s.exportLayout)
  const importLayout = useDesignStore(s => s.importLayout)
  const editMode = useDesignStore(s => s.editMode)
  const toggleEditMode = useDesignStore(s => s.toggleEditMode)
  const aiApiKey = useDesignStore(s => s.aiApiKey)
  const aiLoading = useDesignStore(s => s.aiLoading)
  const setAiPreview = useDesignStore(s => s.setAiPreview)

  const [openMenu, setOpenMenu] = useState<MenuKey>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blueprintInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSelection = selection.kind !== null && selection.id !== null
  const selRoom = selection.kind === 'room' ? rooms.find(r => r.id === selection.id) : null
  const selFurn = selection.kind === 'furniture' ? furniture.find(f => f.id === selection.id) : null
  const selFurnCat = selFurn ? FURNITURE_CATALOG.find(c => c.type === selFurn.type) : null
  const selRoomCat = selRoom ? ROOM_TYPES.find(c => c.type === selRoom.type) : null

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

  const handleSave = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    downloadFile(json)
  }

  const handleLoad = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await readFile(file)
      const data = validateAndParse(text)
      importLayout(data)
    } catch {
      alert('Geçersiz dosya formatı')
    }
    e.target.value = ''
  }

  const handleExportPng = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'eviniyerlestir-plan.png'
    a.click()
  }

  const handleShareLink = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    const url = `${window.location.origin}${window.location.pathname}#plan=${encoded}`
    navigator.clipboard.writeText(url).then(() => alert('Link kopyalandı!')).catch(() => {
      prompt('Linki kopyalayın:', url)
    })
  }

  const handleAiBlueprint = async () => {
    if (!blueprintUrl) return
    try {
      let dataUrl: string
      if (blueprintUrl.startsWith('data:')) {
        dataUrl = blueprintUrl
      } else {
        const blob = await fetch(blueprintUrl).then(r => r.blob())
        dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = rej
          reader.readAsDataURL(blob)
        })
      }
      const preview = await parseBlueprint(dataUrl, 1)
      setAiPreview(preview)
    } catch (err) {
      alert('AI analizi başarısız: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

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
        {isDrawing && (
          <div className="pointer-events-auto bg-amber-100/95 backdrop-blur-sm rounded-2xl shadow-md border border-amber-400/50 py-1 px-3 text-[11px] text-amber-900 flex items-center gap-2 whitespace-nowrap" data-testid="drawing-badge">
            <b>✏ Çizim Modu</b> — Tıkla: nokta ekle ({drawPoints.length}) | İlk noktaya yaklaş: oda oluştur
            {drawPoints.length > 0 && (
              <button onClick={clearDrawPoints} className="ml-1 px-1.5 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-[10px]" data-testid="btn-clear-draw">🗑</button>
            )}
          </div>
        )}

        {blueprintUrl && !isDrawing && (
          <div className="pointer-events-auto bg-blue-50/95 backdrop-blur-sm rounded-2xl shadow-md border border-blue-300/40 py-1 px-3 text-[10px] text-blue-900 flex items-center gap-2 whitespace-nowrap flex-wrap justify-center" data-testid="blueprint-controls">
            <span className="font-bold">🗺 Kroki</span>
            <label className="flex items-center gap-1">
              Boyut:
              <input type="range" min={2} max={40} step={0.5} value={blueprintScale}
                onChange={e => setBlueprintScale(parseFloat(e.target.value))}
                className="w-14 h-3 accent-blue-600 cursor-pointer" />
              <span className="w-5 text-right text-[9px]">{blueprintScale}m</span>
            </label>
            <label className="flex items-center gap-1">
              Saydamlık:
              <input type="range" min={0.1} max={1} step={0.05} value={blueprintOpacity}
                onChange={e => setBlueprintOpacity(parseFloat(e.target.value))}
                className="w-14 h-3 accent-blue-600 cursor-pointer" />
            </label>
            {aiApiKey && (
              <button
                onClick={handleAiBlueprint}
                disabled={aiLoading}
                className="px-2 py-0.5 bg-amber-100 border border-amber-400/50 rounded-xl text-[9px] font-bold text-amber-800 cursor-pointer hover:bg-amber-200 disabled:opacity-40 transition-colors"
                data-testid="btn-ai-blueprint"
              >
                {aiLoading ? '⏳' : '🤖 AI Analiz'}
              </button>
            )}
            <button
              onClick={() => setBlueprint(null)}
              className="px-2 py-0.5 bg-red-50 border border-red-300/40 rounded-xl text-[9px] font-bold text-red-700 cursor-pointer hover:bg-red-100 transition-colors"
              data-testid="btn-blueprint-remove"
            >🗑</button>
          </div>
        )}

        {showCompass && !isDrawing && (
          <div className="pointer-events-auto bg-amber-50/95 backdrop-blur-sm rounded-2xl shadow-md border border-amber-400/40 py-1 px-3 text-[10px] text-amber-900 flex items-center gap-3 whitespace-nowrap flex-wrap justify-center" data-testid="sun-controls">
            <span className="font-bold">🌞 Güneş</span>
            <label className="flex items-center gap-1">
              Saat:
              <input type="range" min={0} max={24} step={0.5} value={sunHour}
                onChange={e => setSunHour(parseFloat(e.target.value))}
                className="w-20 h-3 accent-amber-600 cursor-pointer" />
              <span className="w-9 text-right text-[10px] font-mono">{sunHour.toFixed(1)}h</span>
            </label>
            <label className="flex items-center gap-1">
              Ay:
              <input type="range" min={1} max={12} step={1} value={sunMonth}
                onChange={e => setSunMonth(parseInt(e.target.value))}
                className="w-14 h-3 accent-amber-600 cursor-pointer" />
              <span className="w-4 text-right text-[10px]">{sunMonth}</span>
            </label>
            <label className="flex items-center gap-1">
              🧭 K°:
              <input type="range" min={0} max={360} step={5}
                value={Math.round((compassAngle * 180) / Math.PI)}
                onChange={e => setCompassAngle((parseFloat(e.target.value) * Math.PI) / 180)}
                className="w-16 h-3 accent-amber-600 cursor-pointer" />
              <span className="w-7 text-right text-[10px]">{Math.round((compassAngle * 180) / Math.PI)}°</span>
            </label>
          </div>
        )}

        {!isDrawing && (selRoom || selFurn) && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-stone-300/30 py-1 px-3 text-[11px] text-stone-800 flex items-center gap-1.5 whitespace-nowrap" data-testid="selection-badge">
            {selRoom && (
              <>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selRoom.color) }} />
                <b>{selRoomCat?.icon} {selRoomCat?.label}</b> seçili — sürükle / ↻
              </>
            )}
            {selFurn && (
              <>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selFurn.color) }} />
                <b>{selFurnCat?.icon} {selFurnCat?.label ?? selFurn.customLabel}</b> seçili — sürükle / ↻
              </>
            )}
          </div>
        )}

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
              className={groupBtn(openMenu === 'tools' || editMode === 'resize')}
              data-testid="menu-tools"
              title="Araçlar"
            >
              🛠 <span className="hidden sm:inline">Araçlar</span>
              <span className="text-[9px] opacity-60">{openMenu === 'tools' ? '▾' : '▸'}</span>
            </button>
            {openMenu === 'tools' && (
              <div className="absolute bottom-full mb-1.5 left-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-52 z-30">
                <button
                  onClick={() => { toggleEditMode(); setOpenMenu(null) }}
                  className={itemBtn(editMode === 'resize')}
                  data-testid="btn-edit-mode"
                >
                  <span className="w-5">{editMode === 'move' ? '↔' : '⊞'}</span>
                  {editMode === 'move' ? 'Taşıma Modu' : 'Boyutlandırma Modu'}
                  <span className="ml-auto text-[9px] text-stone-400">M</span>
                </button>
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
              <div className="absolute bottom-full mb-1.5 left-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-52 z-30">
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
              <div className="absolute bottom-full mb-1.5 right-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-1.5 w-56 z-30">
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
                <div className="border-t border-stone-200/50 my-1" />
                <button
                  onClick={() => { i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr'); setOpenMenu(null) }}
                  className={itemBtn()}
                  data-testid="btn-lang"
                >
                  <span className="w-5">🌐</span> Dil: {i18n.language === 'tr' ? 'Türkçe' : 'English'}
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
            alert('Dosya okunamadı: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
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
