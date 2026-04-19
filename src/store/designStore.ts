/**
 * designStore — uygulamanın tek Zustand store'u.
 *
 * Kapsam: sahne (odalar, mobilya), seçim, görünüm, çizim, AI önizleme, toast
 * bildirimleri, kullanıcı tercihleri (persist edilen) ve geçici UI state.
 *
 * Middleware yığını:
 *   create → persist → temporal → slice
 *   - persist: rooms/furniture + kullanıcı ayarları localStorage'a yazılır
 *   - temporal (zundo): rooms/furniture için undo/redo (50 adım, 300ms debounce)
 *
 * Önceki monolitik halinde (~650 satır) factory'ler ve dönüşüm matematiği
 * aksiyonların içine gömülüydü. Bu sürümde:
 *   - `factories.ts`: Room / FurnitureItem / Opening kurucuları + id counter
 *   - `transforms.ts`: oda rotasyonu etrafında mobilya döndürme / kaydırma
 *   - `aiPreview.ts`: AI önizlemeyi state'e uygulayan saf fonksiyon + tipler
 * Store dosyası artık ~350 satır — aksiyonlar ince wrapper'lara indi.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type {
  Room, FurnitureItem, Selection, SelectionKind, LayoutData,
  RoomType, FurnitureType, WallSide, OpeningType, WallOpening, Floor,
} from '../types'

import {
  createRoomFromType, createPolygonRoom,
  createFurnitureItem, createCustomFurnitureItem,
  createOpening, nextFurnitureId, resetIdCounters,
} from './factories'
import {
  rotateFurnitureAroundRoom, translateFurnitureWithRoom,
} from './transforms'
import { applyPreviewToState, type AIPreview } from './aiPreview'

/**
 * Kat listesinin `baseY`'lerini order'a göre ve her katın
 * ceilingHeight'ına (ya da global fallback'a) göre yeniden hesaplar.
 * order=0 katı baseY=0, üstü = altı + altKatTavanYüksekliği.
 */
function recomputeBaseYs(floors: Floor[], globalCeiling: number): Floor[] {
  const sorted = [...floors].sort((a, b) => a.order - b.order)
  let cumulativeY = 0
  // Önce order>=0 yukarı doğru
  const above = sorted.filter(f => f.order >= 0)
  const below = sorted.filter(f => f.order < 0)
  const result: Record<string, Floor> = {}
  for (const f of above) {
    result[f.id] = { ...f, baseY: cumulativeY }
    cumulativeY += f.ceilingHeight ?? globalCeiling
  }
  // Bodrum katları (negatif order): order -1 en üstteki bodrum (-ceiling), -2 daha aşağı
  // En yüksek order'lı negatif önce gelir (ör. -1 önce, sonra -2)
  const belowSorted = [...below].sort((a, b) => b.order - a.order)
  let belowY = 0
  for (const f of belowSorted) {
    belowY -= f.ceilingHeight ?? globalCeiling
    result[f.id] = { ...f, baseY: belowY }
  }
  return sorted.map(f => result[f.id])
}

// AIPreview dışa verilir — PropertiesPanel, AIPanel referans alır.
// AIPreviewType ve AIVariant yalnızca aiPreview.ts içinde kullanılır.
export type { AIPreview }

// ── Toast Types ──
export type ToastType = 'success' | 'error' | 'info' | 'warning'
export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number   // ms; 0 = manuel kapatma
}

interface DesignState {
  rooms: Room[]
  furniture: FurnitureItem[]
  selection: Selection
  isTopView: boolean
  isDragging: boolean
  isDrawing: boolean
  showDimensions: boolean
  compassAngle: number       // kuzey yonu (radyan, 0 = +Z asagi)
  sunHour: number            // 0-24 saat
  sunMonth: number           // 1-12 ay (mevsim)
  showCompass: boolean
  ceilingHeight: number      // kat yüksekliği (metre, 2.0-4.0)
  setCeilingHeight: (h: number) => void
  ambientIntensity: number   // ortam ışığı şiddeti (0-1)
  setAmbientIntensity: (i: number) => void
  hasSeenWelcome: boolean    // ilk ziyaret welcome modal kontrolü
  setHasSeenWelcome: (v: boolean) => void
  detailedLighting: boolean  // indirect illumination + SSAO (persist)
  setDetailedLighting: (v: boolean) => void
  hdriEnvironment: boolean   // HDRI ortam haritası (persist, detailedLighting'e bağlı)
  setHdriEnvironment: (v: boolean) => void
  walkMode: boolean          // #3 birinci-şahıs yürüyüş modu (persist edilmez)
  setWalkMode: (v: boolean) => void
  /**
   * Dış Cephe Modu: tüm katları tam render eder (ghost YOK) ve hiçbir
   * kat seçimi/editleme gerekmez. Binayı dış cephe olarak inceleme için.
   */
  facadeMode: boolean
  setFacadeMode: (v: boolean) => void

  // ── #6 Multi-floor foundation ────────────────────────────────────────────
  floors: Floor[]            // kat listesi (sıra ile)
  activeFloorId: string      // şu an görüntülenen/düzenlenen kat
  addFloor: (label?: string) => string
  removeFloor: (id: string) => void
  renameFloor: (id: string, label: string) => void
  setActiveFloor: (id: string) => void
  setFloorCeilingHeight: (id: string, h: number) => void
  /** Kat özel ceilingHeight'ını kaldırır — kat global'e döner */
  resetFloorCeilingHeight: (id: string) => void
  /** Bir katın çatı tipini ayarla ('none' çatıyı kaldırır) */
  setFloorRoofType: (id: string, roofType: import('../types').RoofType) => void
  /** Bir katı çatı katı (attic) olarak işaretle */
  setFloorIsAttic: (id: string, isAttic: boolean) => void
  /**
   * Helper — verilen kat ya da odanın floorId'sinden kat'a erişip tavan
   * yüksekliğini döner. Kat özel `ceilingHeight` varsa onu, yoksa global'i.
   */
  getFloorCeilingHeight: (floorId: string | undefined) => number
  preventRoomOverlap: boolean      // odalar sürüklenirken çakışmasın
  setPreventRoomOverlap: (v: boolean) => void
  blueprintUrl: string | null
  blueprintScale: number       // metre/piksel ölçeği
  blueprintOpacity: number
  drawPoints: [number, number][]  // x, z world coords

  // AI (Cycle 2)
  aiApiKey: string | null            // localStorage'da persist
  aiPreview: AIPreview | null         // anlik onizleme
  aiLoading: boolean
  pendingAutoPin: { furnitureId: string; roomId: string } | null
  setAiApiKey: (key: string | null) => void
  setAiPreview: (p: AIPreview | null) => void
  setAiLoading: (l: boolean) => void
  setPendingAutoPin: (p: { furnitureId: string; roomId: string } | null) => void
  applyAiPreview: () => void

  // Toasts (persist edilmez)
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => string
  dismissToast: (id: string) => void

  // ── Çoklu seçim (geçici, persist edilmez) ───────────────────────────────
  /** Çoklu seçimde bulunan oda ve mobilya id'leri */
  multiSelectedIds: string[]
  /** Alan seçimi (rubber-band) dikdörtgeni — client koordinatları */
  rubberBand: { x1: number; y1: number; x2: number; y2: number } | null
  /** Seçim kümesini tamamen değiştirir */
  setMultiSelected: (ids: string[]) => void
  /** Bir öğeyi çoklu seçime ekler ya da çıkarır */
  toggleMultiSelect: (id: string) => void
  /** Çoklu seçimi temizler */
  clearMultiSelection: () => void
  /** Rubber-band dikdörtgenini günceller (null → gizle) */
  setRubberBand: (rb: { x1: number; y1: number; x2: number; y2: number } | null) => void
  /**
   * Çoklu seçimdeki tüm odaları ve mobilyaları aynı anda (dx, dz) kadar taşır.
   * Odaların pinli mobilyaları da birlikte hareket eder.
   */
  moveMultiSelection: (dx: number, dz: number) => void
  /** Çoklu seçimdeki tüm öğeleri siler */
  deleteMultiSelection: () => void

  // UI state (geçici, persist edilmez)
  contextMenuPos: { x: number; y: number } | null
  setContextMenuPos: (pos: { x: number; y: number } | null) => void
  duplicateFurniture: (id: string) => void
  selectOpening: (id: string, roomId: string) => void

  // Group transforms (hibrit oda-mobilya bag)
  moveRoomWithFurniture: (roomId: string, dx: number, dz: number) => void
  rotateRoomWithFurniture: (roomId: string, dRot: number) => void

  // Blueprint
  setBlueprint: (url: string | null) => void
  setBlueprintScale: (scale: number) => void
  setBlueprintOpacity: (opacity: number) => void

  // Dimensions
  toggleDimensions: () => void

  // Compass + Sun
  setCompassAngle: (angle: number) => void
  setSunHour: (hour: number) => void
  setSunMonth: (month: number) => void
  toggleCompass: () => void

  // Drawing mode
  setDrawing: (drawing: boolean) => void
  addDrawPoint: (x: number, z: number) => void
  clearDrawPoints: () => void
  finalizeDrawing: () => string | null  // returns room id or null

  // Dragging
  setDragging: (dragging: boolean) => void

  // Room CRUD
  addRoom: (type: RoomType) => string
  updateRoom: (id: string, patch: Partial<Room>) => void
  removeRoom: (id: string) => void

  // Furniture CRUD
  addFurniture: (type: FurnitureType, variant?: string) => string
  addCustomFurniture: (label: string, modelUrl: string) => string
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void

  // Varsayılan varyantlar (kullanıcı tercihleri, localStorage'da persist)
  defaultVariants: Record<string, string>
  setDefaultVariant: (type: string, variantId: string) => void

  // Selection
  select: (kind: SelectionKind, id: string | null) => void
  deselect: () => void

  // Openings (doors/windows)
  addOpening: (roomId: string, wall: WallSide, type: OpeningType) => void
  /** Polygon odaya kenar indeksine göre açıklık ekler */
  addPolygonOpening: (roomId: string, wallIndex: number, type: OpeningType) => void
  removeOpening: (roomId: string, openingId: string) => void
  updateOpening: (roomId: string, openingId: string, patch: Partial<WallOpening>) => void

  // Wall removal
  toggleWall: (roomId: string, wall: WallSide) => void
  /** Polygon odada kenar indeksine göre duvar kaldır/geri getir */
  togglePolygonWall: (roomId: string, wallIndex: number) => void
  /**
   * Bir duvarın iç veya dış cephe rengini ayarlar.
   * color=null → ilgili yüzü odanın genel rengine döndürür (override kaldırır).
   * wallKey: dikdörtgen='left'|'right'|'front'|'back', polygon=kenar indeksi string ('0','1',...)
   */
  setWallColor: (roomId: string, wallKey: string, face: 'inner' | 'outer', color: string | null) => void

  // Pin/Unpin
  pinToRoom: (furnitureId: string, roomId: string) => void
  unpinFromRoom: (furnitureId: string) => void

  // View
  setTopView: (isTop: boolean) => void

  // Layout
  exportLayout: () => LayoutData
  importLayout: (data: LayoutData) => void
  clear: () => void
}

export const useDesignStore = create<DesignState>()(
  persist(
    temporal(
      (set, get) => ({
        // ── Sahne state (persist + temporal takipli) ────────────────────────────
        rooms: [],
        furniture: [],
        selection: { kind: null, id: null },

        // ── Görünüm / UI ayarları ────────────────────────────────────────────────
        isTopView: false,
        isDragging: false,
        isDrawing: false,
        showDimensions: false,
        compassAngle: 0,
        sunHour: 12,
        sunMonth: 6,
        showCompass: false,
        ceilingHeight: 2.65,
        setCeilingHeight: (h) => set(s => {
          const clamped = Math.max(2.0, Math.min(4.0, h))
          // Global fallback'a düşen katların baseY'sini yeniden hesapla
          return {
            ceilingHeight: clamped,
            floors: recomputeBaseYs(s.floors, clamped),
          }
        }),
        ambientIntensity: 0.35,
        setAmbientIntensity: (i) => set({ ambientIntensity: Math.max(0, Math.min(1, i)) }),
        hasSeenWelcome: false,
        setHasSeenWelcome: (v) => set({ hasSeenWelcome: v }),
        detailedLighting: false,
        setDetailedLighting: (v) => set(s => ({
          detailedLighting: v,
          // Detaylı mod kapanırsa HDRI de kapansın (bağımlı toggle)
          hdriEnvironment: v ? s.hdriEnvironment : false,
        })),
        hdriEnvironment: false,
        setHdriEnvironment: (v) => set({ hdriEnvironment: v }),
        // Walk mode: geçici UI state, persist edilmez (her açılışta kapalı)
        walkMode: false,
        setWalkMode: (v) => set({ walkMode: v, selection: { kind: null, id: null } }),
        // Dış Cephe Modu: tüm katları görünür yapar, seçim kapatır
        facadeMode: false,
        setFacadeMode: (v) => set({ facadeMode: v, selection: { kind: null, id: null } }),

        // ── #6 Multi-floor ────────────────────────────────────────────────
        // Varsayılan tek kat ("Zemin Kat"). Eski layout'lar bu id'ye
        // (`floor-ground`) fallback olarak bağlanır — geri uyum garantili.
        floors: [{ id: 'floor-ground', label: 'Zemin Kat', order: 0, baseY: 0 }],
        activeFloorId: 'floor-ground',
        addFloor: (label) => {
          const existing = get().floors
          const maxOrder = existing.reduce((m, f) => Math.max(m, f.order), -1)
          const order = maxOrder + 1
          const id = `floor-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
          const floor: Floor = {
            id,
            label: label ?? `${order + 1}. Kat`,
            order,
            baseY: 0, // recomputeBaseYs düzeltir
            // ceilingHeight tanımlanmaz → global'e düşer (kullanıcı ayrı set ederse üzerine yazılır)
          }
          set(s => ({
            floors: recomputeBaseYs([...s.floors, floor], s.ceilingHeight),
            // #6: yeni katı otomatik aktif yap — kullanıcı ekledikten sonra
            // orada oda/mobilya eklemeye başlasın (UX iyileştirmesi)
            activeFloorId: id,
            selection: { kind: null, id: null },
          }))
          return id
        },
        removeFloor: (id) => set(s => {
          // En az 1 kat kalmalı — silinmek istenen tek katsa reddet
          if (s.floors.length <= 1) return s
          const remaining = s.floors.filter(f => f.id !== id)
          const activeFloorId = s.activeFloorId === id ? remaining[0].id : s.activeFloorId
          return {
            floors: recomputeBaseYs(remaining, s.ceilingHeight),
            activeFloorId,
            // Silinen katın odalarını aktif kata taşı (veri kaybını önle)
            rooms: s.rooms.map(r => r.floorId === id ? { ...r, floorId: activeFloorId } : r),
          }
        }),
        renameFloor: (id, label) => set(s => ({
          floors: s.floors.map(f => f.id === id ? { ...f, label } : f),
        })),
        setActiveFloor: (id) => {
          if (!get().floors.some(f => f.id === id)) return
          set({ activeFloorId: id, selection: { kind: null, id: null } })
        },
        setFloorCeilingHeight: (id, h) => set(s => {
          const clamped = Math.max(2.0, Math.min(4.0, h))
          const updated = s.floors.map(f => f.id === id ? { ...f, ceilingHeight: clamped } : f)
          return { floors: recomputeBaseYs(updated, s.ceilingHeight) }
        }),
        resetFloorCeilingHeight: (id) => set(s => {
          const updated = s.floors.map(f => {
            if (f.id !== id) return f
            // ceilingHeight alanını tamamen kaldır (object rest destructuring)
            const { ceilingHeight: _removed, ...rest } = f
            void _removed
            return rest
          })
          return { floors: recomputeBaseYs(updated, s.ceilingHeight) }
        }),
        setFloorRoofType: (id, roofType) => set(s => ({
          floors: s.floors.map(f => f.id === id ? { ...f, roofType } : f),
        })),
        setFloorIsAttic: (id, isAttic) => set(s => ({
          floors: s.floors.map(f => f.id === id ? { ...f, isAttic } : f),
        })),
        getFloorCeilingHeight: (floorId) => {
          if (!floorId) return get().ceilingHeight
          const floor = get().floors.find(f => f.id === floorId)
          return floor?.ceilingHeight ?? get().ceilingHeight
        },
        preventRoomOverlap: true,
        setPreventRoomOverlap: (v) => set({ preventRoomOverlap: v }),
        blueprintUrl: null,
        blueprintScale: 10,
        blueprintOpacity: 0.5,
        drawPoints: [],

        // ── AI state ────────────────────────────────────────────────────────────
        aiApiKey: typeof window !== 'undefined' ? localStorage.getItem('eviniyerlestir-ai-key') : null,
        aiPreview: null,
        aiLoading: false,
        pendingAutoPin: null,

        // ── Toast state ─────────────────────────────────────────────────────────
        toasts: [],
        showToast: (message, type = 'info', duration = 4000) => {
          const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          set(s => ({ toasts: [...s.toasts, { id, type, message, duration }] }))
          return id
        },
        dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

        // ── Çoklu seçim (geçici, persist edilmez) ───────────────────────────────
        multiSelectedIds: [],
        rubberBand: null,
        setMultiSelected: (ids) => set({ multiSelectedIds: ids, selection: { kind: null, id: null } }),
        toggleMultiSelect: (id) => set(s => {
          const has = s.multiSelectedIds.includes(id)
          return { multiSelectedIds: has ? s.multiSelectedIds.filter(x => x !== id) : [...s.multiSelectedIds, id] }
        }),
        clearMultiSelection: () => set({ multiSelectedIds: [] }),
        setRubberBand: (rb) => set({ rubberBand: rb }),
        moveMultiSelection: (dx, dz) => set(s => {
          const ids = new Set(s.multiSelectedIds)
          if (ids.size === 0) return s
          const movedRoomIds = new Set<string>()
          const rooms = s.rooms.map(r => {
            if (!ids.has(r.id)) return r
            movedRoomIds.add(r.id)
            return { ...r, position: [r.position[0] + dx, r.position[1] + dz] as [number, number] }
          })
          const furniture = s.furniture.map(f => {
            // Seçili odaya pinli → oda ile hareket et
            if (f.parentRoomId && movedRoomIds.has(f.parentRoomId)) {
              return { ...f, position: [f.position[0] + dx, f.position[1] + dz] as [number, number] }
            }
            // Doğrudan seçili (bağımsız mobilya)
            if (ids.has(f.id)) {
              return { ...f, position: [f.position[0] + dx, f.position[1] + dz] as [number, number] }
            }
            return f
          })
          return { rooms, furniture }
        }),
        deleteMultiSelection: () => {
          const ids = new Set(get().multiSelectedIds)
          if (ids.size === 0) return
          set(s => ({
            rooms: s.rooms.filter(r => !ids.has(r.id)),
            furniture: s.furniture.filter(f => !ids.has(f.id)),
            multiSelectedIds: [],
            selection: { kind: null, id: null },
          }))
        },

        // ── Geçici UI (contextMenu, default variants) ───────────────────────────
        contextMenuPos: null,
        setContextMenuPos: (pos) => set({ contextMenuPos: pos }),

        defaultVariants: {},
        setDefaultVariant: (type, variantId) => set(s => ({
          defaultVariants: { ...s.defaultVariants, [type]: variantId },
        })),

        selectOpening: (id, roomId) => set({ selection: { kind: 'opening', id, parentId: roomId } }),

        duplicateFurniture: (id) => {
          const item = get().furniture.find(f => f.id === id)
          if (!item) return
          const newId = nextFurnitureId()
          const newItem: FurnitureItem = {
            ...item,
            id: newId,
            position: [item.position[0] + 0.4, item.position[1] + 0.4],
            parentRoomId: null,
            // #6: klonlanan mobilya aynı katta kalsın; orijinalde floorId yoksa aktif kata
            floorId: item.floorId ?? get().activeFloorId,
          }
          set(s => ({
            furniture: [...s.furniture, newItem],
            selection: { kind: 'furniture', id: newId },
          }))
        },

        // ── AI aksiyonları ──────────────────────────────────────────────────────
        setAiApiKey: (key) => {
          if (typeof window !== 'undefined') {
            if (key) localStorage.setItem('eviniyerlestir-ai-key', key)
            else localStorage.removeItem('eviniyerlestir-ai-key')
          }
          set({ aiApiKey: key })
        },
        setAiPreview: (p) => set({ aiPreview: p }),
        setAiLoading: (l) => set({ aiLoading: l }),
        setPendingAutoPin: (p) => set({ pendingAutoPin: p }),

        applyAiPreview: () => {
          const preview = get().aiPreview
          if (!preview) return
          // BUG-002: clamp selectedIndex so an out-of-bounds value doesn't
          // cause applyPreviewToState to silently pick the wrong variant.
          const safePreview = {
            ...preview,
            selectedIndex: Math.max(0, Math.min(preview.variants.length - 1, preview.selectedIndex)),
          }
          const next = applyPreviewToState(safePreview, {
            rooms: get().rooms,
            furniture: get().furniture,
          }, get().activeFloorId)
          if (!next) return
          // #6: Replace modunda AI yeni kat getirmezse mevcut katlar korunur;
          // yeni oda/mobilya aktif kata bağlanır (applyPreviewToState'de).
          set({
            rooms: next.rooms,
            furniture: next.furniture,
            aiPreview: null,
            ...(safePreview.applyMode === 'replace' ? { selection: { kind: null, id: null } } : {}),
          })
        },

        // ── Grup dönüşümleri (oda + bağlı mobilya) ──────────────────────────────
        moveRoomWithFurniture: (roomId, dx, dz) => set(s => ({
          rooms: s.rooms.map(r => r.id === roomId
            ? { ...r, position: [r.position[0] + dx, r.position[1] + dz] }
            : r),
          furniture: translateFurnitureWithRoom(roomId, s.furniture, dx, dz),
        })),

        rotateRoomWithFurniture: (roomId, dRot) => set(s => {
          const room = s.rooms.find(r => r.id === roomId)
          if (!room) return s
          return {
            rooms: s.rooms.map(r => r.id === roomId
              ? { ...r, rotation: r.rotation + dRot }
              : r),
            furniture: rotateFurnitureAroundRoom(room, s.furniture, dRot),
          }
        }),

        // ── Blueprint ───────────────────────────────────────────────────────────
        setBlueprint: (url) => set({ blueprintUrl: url, isTopView: true }),
        setBlueprintScale: (scale) => set({ blueprintScale: scale }),
        setBlueprintOpacity: (opacity) => set({ blueprintOpacity: opacity }),

        // ── Ölçü + Pusula/Güneş ─────────────────────────────────────────────────
        toggleDimensions: () => set(s => ({ showDimensions: !s.showDimensions })),
        setCompassAngle: (angle) => set({ compassAngle: angle }),
        setSunHour: (hour) => set({ sunHour: hour }),
        setSunMonth: (month) => set({ sunMonth: month }),
        toggleCompass: () => set(s => ({ showCompass: !s.showCompass })),

        // ── Çizim modu ──────────────────────────────────────────────────────────
        setDrawing: (drawing) => {
          set({ isDrawing: drawing, drawPoints: [] })
          if (drawing) set({ isTopView: true, selection: { kind: null, id: null } })
        },
        addDrawPoint: (x, z) => {
          set(s => ({ drawPoints: [...s.drawPoints, [x, z] as [number, number]] }))
        },
        clearDrawPoints: () => set({ drawPoints: [] }),
        finalizeDrawing: () => {
          const activeFloorId = get().activeFloorId
          const existingOnFloor = get().rooms.filter(r => (r.floorId ?? 'floor-ground') === activeFloorId).length
          // createPolygonRoom: gerçek polygon oda (bounding-box dikdörtgen değil)
          const base = createPolygonRoom(get().drawPoints, existingOnFloor)
          if (!base) return null
          const room = { ...base, floorId: activeFloorId }
          set(s => ({
            rooms: [...s.rooms, room],
            selection: { kind: 'room', id: room.id },
            isDrawing: false,
            drawPoints: [],
          }))
          return room.id
        },

        setDragging: (dragging) => set({ isDragging: dragging }),

        // ── Oda CRUD ────────────────────────────────────────────────────────────
        addRoom: (type) => {
          // #6: aktif kata göre pozisyon (aynı kattaki oda sayısı ile hesap)
          const activeFloorId = get().activeFloorId
          const existingOnFloor = get().rooms.filter(r => (r.floorId ?? 'floor-ground') === activeFloorId).length
          const room = { ...createRoomFromType(type, existingOnFloor), floorId: activeFloorId }
          set(s => ({
            rooms: [...s.rooms, room],
            selection: { kind: 'room', id: room.id },
          }))
          return room.id
        },
        updateRoom: (id, patch) => set(s => ({
          // BUG-004: clamp position to [-500, 500] metres to prevent NaN/Infinity
          rooms: s.rooms.map(r => r.id === id ? {
            ...r,
            ...patch,
            ...(patch.position ? {
              position: [
                Math.max(-500, Math.min(500, patch.position[0])),
                Math.max(-500, Math.min(500, patch.position[1])),
              ] as [number, number],
            } : {}),
          } : r),
        })),
        removeRoom: (id) => set(s => ({
          rooms: s.rooms.filter(r => r.id !== id),
          furniture: s.furniture.map(f => f.parentRoomId === id ? { ...f, parentRoomId: null } : f),
          selection: s.selection.id === id ? { kind: null, id: null } : s.selection,
        })),

        // ── Mobilya CRUD ────────────────────────────────────────────────────────
        addCustomFurniture: (label, modelUrl) => {
          // BUG-001: spawn near first room on ACTIVE floor (aktif katın ilk odasının merkezi)
          const activeFloorId = get().activeFloorId
          const firstRoomOnFloor = get().rooms.find(r => (r.floorId ?? activeFloorId) === activeFloorId)
          const spawnPos: [number, number] = firstRoomOnFloor
            ? [firstRoomOnFloor.position[0], firstRoomOnFloor.position[1]]
            : [0, 0]
          const base = createCustomFurnitureItem(label, modelUrl, get().furniture.length, spawnPos)
          // #6: aktif kata bağla
          const item = { ...base, floorId: activeFloorId }
          set(s => ({
            furniture: [...s.furniture, item],
            selection: { kind: 'furniture', id: item.id },
          }))
          return item.id
        },
        addFurniture: (type, variantOverride) => {
          const activeFloorId = get().activeFloorId
          const firstRoomOnFloor = get().rooms.find(r => (r.floorId ?? activeFloorId) === activeFloorId)
          const spawnPos: [number, number] = firstRoomOnFloor
            ? [firstRoomOnFloor.position[0], firstRoomOnFloor.position[1]]
            : [0, 0]
          const base = createFurnitureItem(type, get().furniture.length, {
            variantOverride,
            userDefaultVariant: get().defaultVariants[type],
            spawnPos,
          })
          if (!base) return ''
          // #6: aktif kata bağla
          const item = { ...base, floorId: activeFloorId }
          set(s => ({
            furniture: [...s.furniture, item],
            selection: { kind: 'furniture', id: item.id },
          }))
          return item.id
        },
        updateFurniture: (id, patch) => set(s => ({
          // BUG-004: clamp position to [-500, 500] metres to prevent NaN/Infinity
          furniture: s.furniture.map(f => f.id === id ? {
            ...f,
            ...patch,
            ...(patch.position ? {
              position: [
                Math.max(-500, Math.min(500, patch.position[0])),
                Math.max(-500, Math.min(500, patch.position[1])),
              ] as [number, number],
            } : {}),
          } : f),
        })),
        removeFurniture: (id) => set(s => ({
          furniture: s.furniture.filter(f => f.id !== id),
          selection: s.selection.id === id ? { kind: null, id: null } : s.selection,
        })),

        // ── Seçim ───────────────────────────────────────────────────────────────
        select: (kind, id) => set({ selection: { kind, id } }),
        deselect: () => set({ selection: { kind: null, id: null } }),

        // ── Açıklıklar (kapı / pencere) ─────────────────────────────────────────
        addOpening: (roomId, wall, type) => {
          const opening = createOpening(type, wall)
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId ? { ...r, openings: [...(r.openings ?? []), opening] } : r
            ),
          }))
        },
        addPolygonOpening: (roomId, wallIndex, type) => {
          // wall='front' dummy değer — polygon renderer wallIndex kullanır
          const opening: WallOpening = { ...createOpening(type, 'front'), wallIndex }
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId ? { ...r, openings: [...(r.openings ?? []), opening] } : r
            ),
          }))
        },
        removeOpening: (roomId, openingId) => set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId
              ? { ...r, openings: (r.openings ?? []).filter(o => o.id !== openingId) }
              : r
          ),
        })),
        updateOpening: (roomId, openingId, patch) => set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId
              ? { ...r, openings: (r.openings ?? []).map(o => o.id === openingId ? { ...o, ...patch } : o) }
              : r
          ),
        })),

        toggleWall: (roomId, wall) => set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const removed = r.removedWalls ?? []
            const isRemoved = removed.includes(wall)
            return {
              ...r,
              removedWalls: isRemoved ? removed.filter(w => w !== wall) : [...removed, wall],
              // Duvar kaldırılırken üstündeki açıklıkları da temizle
              openings: isRemoved ? (r.openings ?? []) : (r.openings ?? []).filter(o => o.wall !== wall),
            }
          }),
        })),

        togglePolygonWall: (roomId, wallIndex) => set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const removed = r.removedWallIndices ?? []
            const isRemoved = removed.includes(wallIndex)
            return {
              ...r,
              removedWallIndices: isRemoved
                ? removed.filter(i => i !== wallIndex)
                : [...removed, wallIndex],
              // Duvar kaldırılırken o duvardaki açıklıkları da temizle
              openings: isRemoved
                ? (r.openings ?? [])
                : (r.openings ?? []).filter(o => o.wallIndex !== wallIndex),
            }
          }),
        })),

        setWallColor: (roomId, wallKey, face, color) => set(s => ({
          rooms: s.rooms.map(r => {
            if (r.id !== roomId) return r
            const prev = r.wallColors ?? {}
            const prevWall = prev[wallKey] ?? {}
            // color=null → yüz override'ı kaldır; kalan yüz varsa kaydı koru
            const updated = color !== null
              ? { ...prevWall, [face]: color }
              : { ...prevWall, [face]: undefined }
            // Eğer her iki yüz de tanımsızsa anahtarı tamamen sil
            const bothUndef = updated.inner === undefined && updated.outer === undefined
            const newWallColors = bothUndef
              ? Object.fromEntries(Object.entries({ ...prev, [wallKey]: updated }).filter(([k]) => k !== wallKey))
              : { ...prev, [wallKey]: updated }
            return { ...r, wallColors: Object.keys(newWallColors).length > 0 ? newWallColors : undefined }
          }),
        })),

        // ── Pin / Unpin (mobilya → oda bağı) ────────────────────────────────────
        pinToRoom: (furnitureId, roomId) => set(s => {
          // #6: Mobilya pin'lendiğinde odanın katına da taşınır
          const room = s.rooms.find(r => r.id === roomId)
          const roomFloorId = room?.floorId ?? s.activeFloorId
          return {
            furniture: s.furniture.map(f =>
              f.id === furnitureId ? { ...f, parentRoomId: roomId, floorId: roomFloorId } : f
            ),
          }
        }),
        unpinFromRoom: (furnitureId) => set(s => ({
          // Unpin: parent temizlenir ama floorId korunur — mobilya aynı katta kalır
          furniture: s.furniture.map(f =>
            f.id === furnitureId ? { ...f, parentRoomId: null } : f
          ),
        })),

        // ── Görünüm ─────────────────────────────────────────────────────────────
        setTopView: (isTop) => set({ isTopView: isTop }),

        // ── Layout I/O ──────────────────────────────────────────────────────────
        exportLayout: () => ({
          version: 1,
          rooms: get().rooms,
          furniture: get().furniture,
          floors: get().floors,
        }),
        importLayout: (data) => {
          resetIdCounters()
          // #6: katlar varsa al, yoksa varsayılan tek zemine dön
          const defaultFloor: Floor = { id: 'floor-ground', label: 'Zemin Kat', order: 0, baseY: 0 }
          const floors = data.floors && data.floors.length > 0 ? data.floors : [defaultFloor]
          // Eksik floorId'si olan odaları VE mobilyaları ilk kata bağla (geri uyum)
          const firstFloorId = floors[0].id
          const rooms = data.rooms.map(r => r.floorId ? r : { ...r, floorId: firstFloorId })
          const furniture = data.furniture.map(f => {
            // Pin'liyse parent odanın katını kullan
            if (f.parentRoomId) {
              const parent = rooms.find(r => r.id === f.parentRoomId)
              return parent ? { ...f, floorId: parent.floorId ?? firstFloorId } : { ...f, floorId: firstFloorId }
            }
            return f.floorId ? f : { ...f, floorId: firstFloorId }
          })
          set({
            rooms,
            furniture,
            floors,
            activeFloorId: firstFloorId,
            selection: { kind: null, id: null },
          })
        },
        clear: () => {
          resetIdCounters()
          set({
            rooms: [],
            furniture: [],
            floors: [{ id: 'floor-ground', label: 'Zemin Kat', order: 0, baseY: 0 }],
            activeFloorId: 'floor-ground',
            selection: { kind: null, id: null },
          })
        },
      }),
      {
        // Sadece rooms ve furniture undo/redo stack'ine alınır — seçim/sürükleme
        // gibi geçici state'i değiştirmek geri-alma geçmişini kirletmesin.
        partialize: (state) => ({
          rooms: state.rooms,
          furniture: state.furniture,
        }),
        limit: 50,
        // Aynı state iki kez arka arkaya itilmesin
        equality: (pastState, currentState) =>
          JSON.stringify(pastState) === JSON.stringify(currentState),
        // Hızlı sürükleme sırasında her tick'te snapshot almasın — 300ms debounce
        handleSet: (handleSet) => {
          let timeout: ReturnType<typeof setTimeout> | undefined
          return (state) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
              handleSet(state)
            }, 300)
          }
        },
      }
    ),
    {
      name: 'eviniyerlestir-layout',
      partialize: (state) => ({
        rooms: state.rooms,
        furniture: state.furniture,
        defaultVariants: state.defaultVariants,
        ceilingHeight: state.ceilingHeight,
        ambientIntensity: state.ambientIntensity,
        hasSeenWelcome: state.hasSeenWelcome,
        preventRoomOverlap: state.preventRoomOverlap,
        detailedLighting: state.detailedLighting,
        hdriEnvironment: state.hdriEnvironment,
        // #6: çok kat meta'sı (oda sayısına göre otomatik aktif kat seçimi)
        floors: state.floors,
        activeFloorId: state.activeFloorId,
      }),
      // BUG-005: sanitize persisted values on rehydration to prevent corrupt
      // localStorage data (e.g. NaN or out-of-range ceilingHeight) from
      // breaking the scene.
      merge: (persisted, current) => {
        const p = persisted as Partial<DesignState>
        // #6 geri uyum: eski persist'te floors yok → varsayılan tek kat.
        // Odaların floorId'si yoksa ilk kata bağla.
        const defaultFloor: Floor = { id: 'floor-ground', label: 'Zemin Kat', order: 0, baseY: 0 }
        const floors = p.floors && p.floors.length > 0 ? p.floors : [defaultFloor]
        const firstFloorId = floors[0].id
        const rooms = (p.rooms ?? current.rooms).map(r =>
          r.floorId && floors.some(f => f.id === r.floorId) ? r : { ...r, floorId: firstFloorId }
        )
        // #6: persist edilmiş furniture'da da floorId eksikse ilk kata bağla
        const furniture = (p.furniture ?? current.furniture).map(f => {
          if (f.parentRoomId) {
            const parent = rooms.find(r => r.id === f.parentRoomId)
            return parent ? { ...f, floorId: parent.floorId ?? firstFloorId } : { ...f, floorId: firstFloorId }
          }
          return f.floorId && floors.some(fl => fl.id === f.floorId) ? f : { ...f, floorId: firstFloorId }
        })
        const activeFloorId = p.activeFloorId && floors.some(f => f.id === p.activeFloorId)
          ? p.activeFloorId
          : firstFloorId
        return {
          ...current,
          ...p,
          rooms,
          furniture,
          floors,
          activeFloorId,
          ceilingHeight: Math.max(2.0, Math.min(4.0,
            typeof p.ceilingHeight === 'number' && isFinite(p.ceilingHeight)
              ? p.ceilingHeight
              : current.ceilingHeight
          )),
          ambientIntensity: Math.max(0, Math.min(1,
            typeof p.ambientIntensity === 'number' && isFinite(p.ambientIntensity)
              ? p.ambientIntensity
              : current.ambientIntensity
          )),
        }
      },
    }
  )
)

