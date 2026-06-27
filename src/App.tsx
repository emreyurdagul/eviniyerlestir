import { useEffect, useCallback, useMemo, useState, useRef, lazy, Suspense } from 'react'
import SceneCanvas from './components/Canvas/SceneCanvas'
import Toolbar from './components/UI/Toolbar'
import PropertiesPanel from './components/UI/PropertiesPanel'
import BottomBar from './components/UI/BottomBar'
import AIToast from './components/UI/AIToast'
import ContextMenu from './components/UI/ContextMenu'
import ErrorBoundary from './components/UI/ErrorBoundary'
import Toaster from './components/UI/Toast'
import RoomMesh from './components/Room/RoomMesh'
import FurnitureItem from './components/Furniture/FurnitureItem'
import GhostRoom from './components/Room/GhostRoom'
import GhostFurniture from './components/Furniture/GhostFurniture'
import RoofMesh from './components/Room/RoofMesh'
import WalkModeHUD from './components/UI/WalkModeHUD'
import FloorTabs from './components/UI/FloorTabs'

// Ağır modal bileşenleri — yalnızca açıldıklarında yüklensinler (bundle küçültme).
// İlk paint'te 400 KB+ JS kazanıyoruz; kullanıcı ilgili butona basana dek
// hiçbiri indirilmiyor.
const FloorPlan2D    = lazy(() => import('./components/UI/FloorPlan2D'))
const AIPanel        = lazy(() => import('./components/UI/AIPanel'))
const PresetGallery  = lazy(() => import('./components/UI/PresetGallery'))
const HelpPanel      = lazy(() => import('./components/UI/HelpPanel'))
const Welcome           = lazy(() => import('./components/UI/Welcome'))
const CustomPlanWizard  = lazy(() => import('./components/UI/CustomPlanWizard'))
const Tour           = lazy(() => import('./components/UI/Tour'))
const AdvancedFloorPlanEditor = lazy(() => import('./components/UI/AdvancedFloorPlanEditor'))
import { useDesignStore } from './store/designStore'
import { validateAndParse } from './services/serialization'
import { useTouchGestures } from './hooks/useTouchGestures'
import { MIN_DIM_CM, MAX_DIM_CM } from './types'
import { MOVE_STEP, RESIZE_STEP, ROOM_RESIZE_STEP } from './constants'

/**
 * App — root bileşen. Uygulama herkese açıktır (auth/giriş ekranı yok);
 * kullanıcılar AI özellikleri için kendi Anthropic API anahtarlarını girer.
 */
export default function App() {
  const allRooms = useDesignStore(s => s.rooms)
  const allFurniture = useDesignStore(s => s.furniture)
  const activeFloorId = useDesignStore(s => s.activeFloorId)
  const floors = useDesignStore(s => s.floors)
  const globalCeiling = useDesignStore(s => s.ceilingHeight)
  const facadeMode = useDesignStore(s => s.facadeMode)
  // #6 Multi-floor: Her katın oda ve mobilya listesi ayrı hesaplanır.
  // Aktif kat full RoomMesh/FurnitureItem (tam render, tıklanabilir);
  // diğer katlar GhostRoom/GhostFurniture (yarı saydam, tıklanamaz) —
  // hizalama için yardımcı, etkileşime girmez. useMemo zorunlu — her
  // render yeni array yaratmak useCallback memoization'ı bozar.
  const floorMap = useMemo(() => {
    const firstFloorId = floors[0]?.id ?? 'floor-ground'
    return floors.map(floor => {
      const floorRooms = allRooms.filter(r => (r.floorId ?? firstFloorId) === floor.id)
      const floorFurniture = allFurniture.filter(f => {
        if (f.parentRoomId) {
          const parent = allRooms.find(r => r.id === f.parentRoomId)
          return parent && (parent.floorId ?? firstFloorId) === floor.id
        }
        return (f.floorId ?? firstFloorId) === floor.id
      })
      return { floor, rooms: floorRooms, furniture: floorFurniture }
    })
  }, [floors, allRooms, allFurniture])
  // Selection + keyboard logic için aktif kat öğeleri
  const rooms = useMemo(
    () => floorMap.find(fi => fi.floor.id === activeFloorId)?.rooms ?? [],
    [floorMap, activeFloorId]
  )
  const furniture = useMemo(
    () => floorMap.find(fi => fi.floor.id === activeFloorId)?.furniture ?? [],
    [floorMap, activeFloorId]
  )
  const selection = useDesignStore(s => s.selection)
  const multiSelectedIds = useDesignStore(s => s.multiSelectedIds)
  const rubberBand = useDesignStore(s => s.rubberBand)
  const deleteMultiSelection = useDesignStore(s => s.deleteMultiSelection)
  const clearMultiSelection = useDesignStore(s => s.clearMultiSelection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const [show2D, setShow2D] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [showCustomPlan, setShowCustomPlan] = useState(false)
  const [showPlanEditor, setShowPlanEditor] = useState(false)
  const hasSeenWelcome = useDesignStore(s => s.hasSeenWelcome)
  const setHasSeenWelcome = useDesignStore(s => s.setHasSeenWelcome)
  const [showWelcome, setShowWelcome] = useState(false)
  useEffect(() => {
    if (!hasSeenWelcome) {
      // Küçük gecikmeyle ilk render sonrası göster (FOUC önlemek için)
      const t = setTimeout(() => setShowWelcome(true), 150)
      return () => clearTimeout(t)
    }
  }, [hasSeenWelcome])
  const aiApiKey = useDesignStore(s => s.aiApiKey)
  const aiLoading = useDesignStore(s => s.aiLoading)
  const aiPreview = useDesignStore(s => s.aiPreview)

  // AI paneli, önizleme geldiğinde otomatik aç.
  // React 19 `set-state-in-effect` uyarısı burada false positive: aiPreview
  // harici bir sinyal (AI servisi) — paneli açma reaksiyonu doğrudan bu
  // sinyalin yan etkisi. Alternatif (subscribeWithSelector) gereksiz karmaşa.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (aiPreview) setShowAI(true) }, [aiPreview])
  const containerRef = useRef<HTMLDivElement>(null)

  // Mobil dokunmatik hareketler
  useTouchGestures(containerRef as React.RefObject<HTMLDivElement>)

  // Son pointer konumunu global olarak takip et (ContextMenu için)
  useEffect(() => {
    const track = (e: PointerEvent) => {
      window.__lastPointerX = e.clientX
      window.__lastPointerY = e.clientY
    }
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', track)
    return () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', track)
    }
  }, [])

  // Sağ tıklamada tarayıcının native context menüsünü engelle.
  // DİKKAT: burada deselect/setContextMenuPos çağırma — bu window listener
  // canvas bubble'ından SONRA çalışır, yani R3F mesh handler'ları state'i
  // ayarladıktan sonra sıfırlar. Menüyü kapatma ContextMenu bileşeninin
  // kendi mousedown listener'ına bırakılıyor.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'CANVAS') {
        e.preventDefault()
      }
    }
    window.addEventListener('contextmenu', handler)
    return () => window.removeEventListener('contextmenu', handler)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return

    // Geri al / İleri al
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      useDesignStore.temporal.getState().undo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      useDesignStore.temporal.getState().redo()
      return
    }

    // Çoğalt
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      if (selection.kind === 'furniture' && selection.id) {
        useDesignStore.getState().duplicateFurniture(selection.id)
      }
      return
    }

    // Seçimi kaldır / çoklu seçimi temizle
    if (e.key === 'Escape') {
      useDesignStore.getState().deselect()
      useDesignStore.getState().clearMultiSelection()
      useDesignStore.getState().setContextMenuPos(null)
      return
    }

    const state = useDesignStore.getState()

    // ── Çoklu seçim kısayolları (tek seçimden önce kontrol et) ──────────────
    if (state.multiSelectedIds.length > 0) {
      // Sil
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        state.deleteMultiSelection()
        return
      }
      // Ok tuşları — tüm seçili öğeleri aynı anda taşı
      const step = e.shiftKey ? 0.01 : MOVE_STEP
      let mdx = 0, mdz = 0
      switch (e.key) {
        case 'ArrowLeft':  mdx = -step; break
        case 'ArrowRight': mdx =  step; break
        case 'ArrowUp':    mdz = -step; break
        case 'ArrowDown':  mdz =  step; break
      }
      if (mdx !== 0 || mdz !== 0) {
        e.preventDefault()
        state.moveMultiSelection(mdx, mdz)
        return
      }
    }

    if (!selection.kind || !selection.id) return

    // ── Mobilya kısayolları ──
    if (selection.kind === 'furniture') {
      const furn = furniture.find(f => f.id === selection.id)
      if (!furn) return

      // Döndür
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        updateFurniture(furn.id, { rotation: furn.rotation + dir * Math.PI / 2 })
        return
      }

      // Boyutlandır: ] veya = büyüt, [ veya - küçült
      if (e.key === ']' || e.key === '=') {
        e.preventDefault()
        const newDims = Object.fromEntries(
          Object.entries(furn.dims).map(([k, v]) => [k, Math.min(MAX_DIM_CM, v + RESIZE_STEP)])
        )
        updateFurniture(furn.id, { dims: newDims })
        return
      }
      if (e.key === '[' || e.key === '-') {
        e.preventDefault()
        const newDims = Object.fromEntries(
          Object.entries(furn.dims).map(([k, v]) => [k, Math.max(MIN_DIM_CM, v - RESIZE_STEP)])
        )
        updateFurniture(furn.id, { dims: newDims })
        return
      }

      // Ok tuşları: Shift → ince adım, normal → standart adım
      let dx = 0, dz = 0
      const step = e.shiftKey ? 0.01 : MOVE_STEP
      switch (e.key) {
        case 'ArrowLeft':  dx = -step; break
        case 'ArrowRight': dx = step; break
        case 'ArrowUp':    dz = -step; break
        case 'ArrowDown':  dz = step; break
        case 'Delete':
        case 'Backspace':
          useDesignStore.getState().removeFurniture(furn.id)
          return
        default: return
      }
      e.preventDefault()
      updateFurniture(furn.id, { position: [furn.position[0] + dx, furn.position[1] + dz] })
      return
    }

    // ── Oda kısayolları ──
    if (selection.kind === 'room') {
      const room = rooms.find(r => r.id === selection.id)
      if (!room) return

      // Döndür
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        updateRoom(room.id, { rotation: room.rotation + dir * Math.PI / 2 })
        return
      }

      // Boyutlandır
      if (e.key === ']' || e.key === '=') {
        e.preventDefault()
        updateRoom(room.id, {
          widthCm: Math.min(MAX_DIM_CM, room.widthCm + ROOM_RESIZE_STEP),
          lengthCm: Math.min(MAX_DIM_CM, room.lengthCm + ROOM_RESIZE_STEP),
        })
        return
      }
      if (e.key === '[' || e.key === '-') {
        e.preventDefault()
        updateRoom(room.id, {
          widthCm: Math.max(MIN_DIM_CM, room.widthCm - ROOM_RESIZE_STEP),
          lengthCm: Math.max(MIN_DIM_CM, room.lengthCm - ROOM_RESIZE_STEP),
        })
        return
      }

      // Ok tuşları: normal → taşı, Shift+ok → boyutlandır (tek eksen)
      if (e.shiftKey) {
        e.preventDefault()
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowRight':
            updateRoom(room.id, {
              widthCm: Math.max(MIN_DIM_CM, room.widthCm + (e.key === 'ArrowRight' ? ROOM_RESIZE_STEP : -ROOM_RESIZE_STEP))
            })
            break
          case 'ArrowUp':
          case 'ArrowDown':
            updateRoom(room.id, {
              lengthCm: Math.max(MIN_DIM_CM, room.lengthCm + (e.key === 'ArrowDown' ? ROOM_RESIZE_STEP : -ROOM_RESIZE_STEP))
            })
            break
          case 'Delete':
          case 'Backspace':
            useDesignStore.getState().removeRoom(room.id)
            break
        }
        return
      }

      let dx = 0, dz = 0
      switch (e.key) {
        case 'ArrowLeft':  dx = -MOVE_STEP; break
        case 'ArrowRight': dx = MOVE_STEP; break
        case 'ArrowUp':    dz = -MOVE_STEP; break
        case 'ArrowDown':  dz = MOVE_STEP; break
        case 'Delete':
        case 'Backspace':
          useDesignStore.getState().removeRoom(room.id)
          return
        default: return
      }
      e.preventDefault()
      updateRoom(room.id, { position: [room.position[0] + dx, room.position[1] + dz] })
    }
  }, [selection, rooms, furniture, updateRoom, updateFurniture])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // URL hash'ten plan yükle
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#plan=')) {
      try {
        const encoded = hash.slice(6)
        const json = decodeURIComponent(escape(atob(encoded)))
        const data = validateAndParse(json)
        useDesignStore.getState().importLayout(data)
        window.location.hash = ''
      } catch { /* ignore invalid hash */ }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-screen relative overflow-hidden" data-testid="app-root">
      <ErrorBoundary compact>
        <SceneCanvas>
          {/* #6: Her kat kendi baseY'sinde render edilir.
              - Normal mod: aktif kat tam, diğerleri ghost (hizalama yardımcısı)
              - Facade mod: TÜM katlar tam render — ghost yok, düzenleme yok.
                Sahneyi dışarıdan bina olarak inceleme. */}
          {floorMap.map(({ floor, rooms: fRooms, furniture: fFurn }) => {
            const isActive = floor.id === activeFloorId
            const fullRender = facadeMode || isActive
            const floorCeiling = floor.ceilingHeight ?? globalCeiling
            return (
              <group key={floor.id} position={[0, floor.baseY, 0]}>
                {fullRender
                  ? fRooms.map(r => <RoomMesh key={r.id} room={r} />)
                  : fRooms.map(r => <GhostRoom key={r.id} room={r} />)
                }
                {fullRender
                  ? fFurn.map(f => <FurnitureItem key={f.id} item={f} />)
                  : fFurn.map(f => <GhostFurniture key={f.id} item={f} />)
                }
                {/* Çatı — kat roofType tanımlıysa render et.
                    Facade mode'da hep, normal modda aktif kat olmasa da
                    (bina silüetini üstten görmek için) görünür. */}
                {floor.roofType && floor.roofType !== 'none' && (
                  <RoofMesh rooms={fRooms} roofType={floor.roofType} ceilingHeight={floorCeiling} />
                )}
              </group>
            )
          })}
        </SceneCanvas>
      </ErrorBoundary>
      <Toolbar />
      <PropertiesPanel onShowPresets={() => setShowPresets(true)} />
      <BottomBar onShow2D={() => setShow2D(true)} onShowPresets={() => setShowPresets(true)} onShowCustomPlan={() => setShowCustomPlan(true)} onShowPlanEditor={() => setShowPlanEditor(true)} />
      <FloorTabs />
      <WalkModeHUD />
      {/* Lazy-loaded modaller: Suspense fallback=null, acilana kadar chunk inmez */}
      <Suspense fallback={null}>
        {show2D && <FloorPlan2D onClose={() => setShow2D(false)} />}
        {showPresets && <PresetGallery open={showPresets} onClose={() => setShowPresets(false)} />}
      </Suspense>

      {/* AI Panel toggle button — PropertiesPanel toggle'ının soluna konumlu, çakışma yok */}
      <button
        onClick={() => setShowAI(v => !v)}
        title="AI Asistan"
        className={`absolute top-3 right-[calc(0.75rem+72px)] sm:right-[calc(0.75rem+72px)] z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-3xl text-xs font-bold shadow-md border transition-all cursor-pointer ${
          showAI
            ? 'bg-amber-400 text-white border-amber-500 shadow-amber-200'
            : aiApiKey
              ? 'bg-white/95 backdrop-blur-sm text-stone-800 border-stone-300/40 hover:shadow-lg'
              : 'bg-white/95 backdrop-blur-sm text-stone-500 border-stone-300/40 hover:shadow-lg'
        }`}
      >
        {aiLoading ? <span className="animate-spin">⏳</span> : '✨'}
        AI
        {!aiApiKey && <span className="text-orange-500 text-[9px]">●</span>}
      </button>

      {/* Help / Yardım butonu — AI butonunun solunda */}
      <button
        onClick={() => setShowHelp(true)}
        title="Yardım & Klavye Kısayolları"
        className="absolute top-3 right-[calc(0.75rem+72px+64px)] z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm text-stone-600 border border-stone-300/40 shadow-md hover:shadow-lg hover:text-sky-700 cursor-pointer text-sm font-bold transition-all"
        data-testid="btn-help"
      >
        ?
      </button>

      <Suspense fallback={null}>
        {showHelp && (
          <HelpPanel
            open={showHelp}
            onClose={() => setShowHelp(false)}
            onStartTour={() => setShowTour(true)}
          />
        )}
        {showTour && (
          <Tour open={showTour} onClose={() => { setShowTour(false); setHasSeenWelcome(true) }} />
        )}
        {showWelcome && (
          <Welcome
            onStartEmpty={() => setShowWelcome(false)}
            onChoosePreset={() => { setShowWelcome(false); setShowPresets(true) }}
            onStartTour={() => { setShowWelcome(false); setShowTour(true) }}
            onCustomPlan={() => { setShowWelcome(false); setShowCustomPlan(true) }}
          />
        )}
        {showCustomPlan && (
          <CustomPlanWizard open={showCustomPlan} onClose={() => setShowCustomPlan(false)} />
        )}
        {showAI && <AIPanel onClose={() => setShowAI(false)} />}
        {showPlanEditor && <AdvancedFloorPlanEditor onClose={() => setShowPlanEditor(false)} />}
      </Suspense>

      {/* Zoom kontrol butonları — sağ alt köşe */}
      <div className="absolute bottom-20 right-3 flex flex-col gap-1 z-10">
        {[
          { detail: 'in',    label: '+',  title: 'Yakınlaştır' },
          { detail: 'reset', label: '⊙',  title: 'Kamerayı Sıfırla' },
          { detail: 'out',   label: '−',  title: 'Uzaklaştır' },
        ].map(({ detail, label, title }) => (
          <button
            key={detail}
            title={title}
            onClick={() => window.dispatchEvent(new CustomEvent('camera-zoom', { detail }))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-stone-700 border border-stone-300/40 shadow-md hover:shadow-lg hover:bg-white cursor-pointer text-base font-bold transition-all select-none"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Rubber-band seçim dikdörtgeni — pointer sürüklerken görünür */}
      {rubberBand && (() => {
        const x  = Math.min(rubberBand.x1, rubberBand.x2)
        const y  = Math.min(rubberBand.y1, rubberBand.y2)
        const w  = Math.abs(rubberBand.x2 - rubberBand.x1)
        const h  = Math.abs(rubberBand.y2 - rubberBand.y1)
        return (
          <div
            style={{
              position: 'fixed',
              left: x, top: y,
              width: w, height: h,
              border: '1.5px dashed #f59e0b',
              background: 'rgba(245,158,11,0.08)',
              pointerEvents: 'none',
              zIndex: 50,
              borderRadius: 2,
            }}
          />
        )
      })()}

      {/* Çoklu seçim rozeti — seçilen eleman sayısı + sil butonu */}
      {multiSelectedIds.length > 0 && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg select-none"
          style={{ pointerEvents: 'auto' }}
        >
          <span>✦ {multiSelectedIds.length} öğe seçili</span>
          <span className="text-white/60 font-normal text-[10px]">↑↓←→ taşı</span>
          <button
            onClick={() => deleteMultiSelection()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 hover:bg-red-500 transition-colors cursor-pointer text-xs"
            title="Seçilenleri sil (Delete)"
          >
            🗑 Sil
          </button>
          <button
            onClick={() => clearMultiSelection()}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer text-xs"
            title="Seçimi kaldır (Escape)"
          >
            ✕
          </button>
        </div>
      )}

      <AIToast />
      <ContextMenu />
      <Toaster />
    </div>
  )
}
