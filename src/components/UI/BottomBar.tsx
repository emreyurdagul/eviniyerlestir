import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'
import { exportToJSON, downloadFile, readFile, validateAndParse } from '../../services/serialization'
import { pdfToImageUrl } from '../../services/pdfImport'

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
  const blueprintInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSelection = selection.kind !== null && selection.id !== null
  const selRoom = selection.kind === 'room' ? rooms.find(r => r.id === selection.id) : null
  const selFurn = selection.kind === 'furniture' ? furniture.find(f => f.id === selection.id) : null
  const selFurnCat = selFurn ? FURNITURE_CATALOG.find(c => c.type === selFurn.type) : null
  const selRoomCat = selRoom ? ROOM_TYPES.find(c => c.type === selRoom.type) : null

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

  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  const btnClass = (highlight = false) =>
    `bg-white/95 backdrop-blur-sm px-3 py-2 rounded-2xl text-[11px] font-semibold cursor-pointer shadow-md hover:-translate-y-0.5 transition-transform whitespace-nowrap border ${
      highlight
        ? 'text-amber-800 bg-amber-100/60 border-amber-400/50'
        : 'text-stone-800 border-stone-300/30'
    }`

  return (
    <>
      {/* Single bottom container - column layout, info ABOVE buttons */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none max-w-[95vw]" data-testid="bottom-area">

        {/* Info badges (above buttons) */}
        {isDrawing && (
          <div className="pointer-events-auto bg-amber-100/95 backdrop-blur-sm rounded-2xl shadow-md border border-amber-400/50 py-1 px-3 text-[11px] text-amber-900 flex items-center gap-2 whitespace-nowrap" data-testid="drawing-badge">
            <b>✏ Çizim Modu</b> — Tıkla: nokta ekle ({drawPoints.length}) | İlk noktaya yaklaş: oda oluştur
          </div>
        )}

        {blueprintUrl && !isDrawing && (
          <div className="pointer-events-auto bg-blue-50/95 backdrop-blur-sm rounded-2xl shadow-md border border-blue-300/40 py-1 px-3 text-[10px] text-blue-900 flex items-center gap-2 whitespace-nowrap" data-testid="blueprint-controls">
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

        {/* Button rows */}
        <div className="pointer-events-auto flex gap-1.5 flex-wrap justify-center">
          <button onClick={() => useDesignStore.temporal.getState().undo()} className={btnClass()} data-testid="btn-undo" title="Ctrl+Z">
            ↩ Geri Al
          </button>
          <button onClick={() => useDesignStore.temporal.getState().redo()} className={btnClass()} data-testid="btn-redo" title="Ctrl+Y">
            ↪ İleri Al
          </button>
          <button onClick={() => setDrawing(!isDrawing)} className={btnClass(isDrawing)} data-testid="btn-draw">
            {isDrawing ? '✕ Bitir' : '✏ Çiz'}
          </button>
          {isDrawing && drawPoints.length > 0 && (
            <button onClick={clearDrawPoints} className={btnClass()} data-testid="btn-clear-draw">
              🗑
            </button>
          )}
          <button onClick={handleRotate} className={btnClass(hasSelection)} data-testid="btn-rotate">
            ↻ Döndür
          </button>
          <button onClick={() => setTopView(!isTopView)} className={btnClass()} data-testid="btn-view-toggle">
            {isTopView ? '🔭 3D' : '🗺 Üst'}
          </button>
          <button onClick={toggleDimensions} className={btnClass(showDimensions)} data-testid="btn-dimensions">
            📏
          </button>
        </div>

        <div className="pointer-events-auto flex gap-1.5 flex-wrap justify-center">
          <button onClick={() => {
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const url = canvas.toDataURL('image/png')
            const a = document.createElement('a')
            a.href = url
            a.download = 'eviniyerlestir-plan.png'
            a.click()
          }} className={btnClass()} data-testid="btn-export-png">
            📸 PNG
          </button>
          {onShow2D && <button onClick={onShow2D} className={btnClass()} data-testid="btn-2d">
            📐 2D
          </button>}
          <button onClick={() => {
            const data = exportLayout()
            const json = exportToJSON(data)
            const encoded = btoa(unescape(encodeURIComponent(json)))
            const url = `${window.location.origin}${window.location.pathname}#plan=${encoded}`
            navigator.clipboard.writeText(url).then(() => alert('Link kopyalandı!')).catch(() => {
              prompt('Linki kopyalayın:', url)
            })
          }} className={btnClass()} data-testid="btn-share-link">
            🔗 Paylaş
          </button>
          <button onClick={() => blueprintInputRef.current?.click()} className={btnClass(!!blueprintUrl)} data-testid="btn-blueprint">
            🗺 {blueprintUrl ? 'Kroki' : 'Kroki/PDF'}
          </button>
          {blueprintUrl && (
            <button onClick={() => setBlueprint(null)} className={btnClass()} data-testid="btn-blueprint-remove">
              🗑 Kroki
            </button>
          )}
          <button onClick={handleSave} className={btnClass()} data-testid="btn-save">
            💾 Kaydet
          </button>
          <button onClick={handleLoad} className={btnClass()} data-testid="btn-load">
            📂 Yükle
          </button>
          <button onClick={() => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')} className={btnClass()} data-testid="btn-lang">
            🌐 {i18n.language === 'tr' ? 'EN' : 'TR'}
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={blueprintInputRef} type="file" accept="image/*,.pdf" onChange={async e => {
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
      }} className="hidden" data-testid="blueprint-input" />
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" data-testid="file-input" />
    </>
  )
}
