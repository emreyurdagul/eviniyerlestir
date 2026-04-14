import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type {
  Room, FurnitureItem, Selection, SelectionKind, LayoutData,
  RoomType, FurnitureType, FloorType, WallSide, OpeningType, WallOpening,
} from '../types'
import { ROOM_TYPES, FURNITURE_CATALOG, ROOM_COLORS, FURNITURE_COLORS } from '../types'

let roomCounter = 0
let furnitureCounter = 0

// ── AI Types ──
export type AIPreviewType = 'placement' | 'plan' | 'style' | 'blueprint' | 'suggestion' | 'photo'

export interface AIVariant {
  label: string
  description?: string
  rooms?: Room[]
  furniture?: FurnitureItem[]
  // For style: only color updates
  styleUpdates?: Array<{ roomId: string; wallColor?: string; wallColorOuter?: string; floorType?: FloorType }>
}

export interface AIPreview {
  type: AIPreviewType
  variants: AIVariant[]
  selectedIndex: number
  // 'replace' = importLayout, 'merge' = add/update existing
  applyMode: 'replace' | 'merge' | 'style'
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

  // UI state (geçici, persist edilmez)
  contextMenuPos: { x: number; y: number } | null
  setContextMenuPos: (pos: { x: number; y: number } | null) => void
  duplicateFurniture: (id: string) => void
  editMode: 'move' | 'resize'
  toggleEditMode: () => void
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
  removeOpening: (roomId: string, openingId: string) => void
  updateOpening: (roomId: string, openingId: string, patch: Partial<WallOpening>) => void

  // Wall removal
  toggleWall: (roomId: string, wall: WallSide) => void

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
        rooms: [],
        furniture: [],
        selection: { kind: null, id: null },
        isTopView: false,
        isDragging: false,
        isDrawing: false,
        showDimensions: false,
        compassAngle: 0,
        sunHour: 12,
        sunMonth: 6,
        showCompass: false,
        blueprintUrl: null,
        blueprintScale: 10,
        blueprintOpacity: 0.5,
        drawPoints: [],

        // AI initial state
        aiApiKey: typeof window !== 'undefined' ? localStorage.getItem('eviniyerlestir-ai-key') : null,
        aiPreview: null,
        aiLoading: false,
        pendingAutoPin: null,

        // UI state
        contextMenuPos: null,
        editMode: 'move',

        // Default variants
        defaultVariants: {},
        setDefaultVariant: (type, variantId) => set(s => ({
          defaultVariants: { ...s.defaultVariants, [type]: variantId },
        })),

        setContextMenuPos: (pos) => set({ contextMenuPos: pos }),
        toggleEditMode: () => set(s => ({ editMode: s.editMode === 'move' ? 'resize' : 'move' })),
        selectOpening: (id, roomId) => set({ selection: { kind: 'opening', id, parentId: roomId } }),

        duplicateFurniture: (id) => {
          const item = get().furniture.find(f => f.id === id)
          if (!item) return
          const newId = `furn-${++furnitureCounter}-${Date.now()}`
          const newItem: FurnitureItem = {
            ...item,
            id: newId,
            position: [item.position[0] + 0.4, item.position[1] + 0.4],
            parentRoomId: null,
          }
          set(s => ({
            furniture: [...s.furniture, newItem],
            selection: { kind: 'furniture', id: newId },
          }))
        },

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
          const variant = preview.variants[preview.selectedIndex]
          if (!variant) return

          if (preview.applyMode === 'replace') {
            set({
              rooms: variant.rooms ?? [],
              furniture: variant.furniture ?? [],
              selection: { kind: null, id: null },
              aiPreview: null,
            })
          } else if (preview.applyMode === 'merge') {
            set(s => ({
              rooms: [...s.rooms, ...(variant.rooms ?? [])],
              furniture: [...s.furniture, ...(variant.furniture ?? [])],
              aiPreview: null,
            }))
          } else if (preview.applyMode === 'style') {
            const updates = variant.styleUpdates ?? []
            set(s => ({
              rooms: s.rooms.map(r => {
                const u = updates.find(u => u.roomId === r.id)
                return u ? { ...r, ...(u.wallColor && { wallColor: u.wallColor }), ...(u.wallColorOuter && { wallColorOuter: u.wallColorOuter }), ...(u.floorType && { floorType: u.floorType }) } : r
              }),
              aiPreview: null,
            }))
          }
        },

        moveRoomWithFurniture: (roomId, dx, dz) => set(s => ({
          rooms: s.rooms.map(r => r.id === roomId
            ? { ...r, position: [r.position[0] + dx, r.position[1] + dz] }
            : r),
          furniture: s.furniture.map(f => f.parentRoomId === roomId
            ? { ...f, position: [f.position[0] + dx, f.position[1] + dz] }
            : f),
        })),

        rotateRoomWithFurniture: (roomId, dRot) => set(s => {
          const room = s.rooms.find(r => r.id === roomId)
          if (!room) return s
          const [cx, cz] = room.position
          const cosR = Math.cos(dRot)
          const sinR = Math.sin(dRot)
          return {
            rooms: s.rooms.map(r => r.id === roomId
              ? { ...r, rotation: r.rotation + dRot }
              : r),
            furniture: s.furniture.map(f => {
              if (f.parentRoomId !== roomId) return f
              // Rotate furniture position around room center
              const dx0 = f.position[0] - cx
              const dz0 = f.position[1] - cz
              const newX = cx + dx0 * cosR - dz0 * sinR
              const newZ = cz + dx0 * sinR + dz0 * cosR
              return { ...f, position: [newX, newZ], rotation: f.rotation + dRot }
            }),
          }
        }),

        setBlueprint: (url) => set({ blueprintUrl: url, isTopView: true }),
        setBlueprintScale: (scale) => set({ blueprintScale: scale }),
        setBlueprintOpacity: (opacity) => set({ blueprintOpacity: opacity }),

        toggleDimensions: () => set(s => ({ showDimensions: !s.showDimensions })),

        setCompassAngle: (angle) => set({ compassAngle: angle }),
        setSunHour: (hour) => set({ sunHour: hour }),
        setSunMonth: (month) => set({ sunMonth: month }),
        toggleCompass: () => set(s => ({ showCompass: !s.showCompass })),

        // ── Drawing mode ──

        setDrawing: (drawing) => {
          set({ isDrawing: drawing, drawPoints: [] })
          if (drawing) set({ isTopView: true, selection: { kind: null, id: null } })
        },

        addDrawPoint: (x, z) => {
          set(s => ({ drawPoints: [...s.drawPoints, [x, z] as [number, number]] }))
        },

        clearDrawPoints: () => set({ drawPoints: [] }),

        finalizeDrawing: () => {
          const pts = get().drawPoints
          if (pts.length < 3) return null

          // Compute bounding box from polygon points
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
          for (const [px, pz] of pts) {
            if (px < minX) minX = px
            if (px > maxX) maxX = px
            if (pz < minZ) minZ = pz
            if (pz > maxZ) maxZ = pz
          }

          const widthM = maxX - minX
          const lengthM = maxZ - minZ
          if (widthM < 0.2 || lengthM < 0.2) return null

          const centerX = (minX + maxX) / 2
          const centerZ = (minZ + maxZ) / 2

          const id = `room-${++roomCounter}-${Date.now()}`
          const color = ROOM_COLORS[get().rooms.length % ROOM_COLORS.length]
          const room: Room = {
            id,
            type: 'salon' as RoomType,
            widthCm: Math.round(widthM * 100),
            lengthCm: Math.round(lengthM * 100),
            position: [centerX, centerZ],
            rotation: 0,
            color,
            wallColor: '#e3ddd4',
            wallColorOuter: '#c8c0b4',
            floorType: 'parke' as FloorType,
            openings: [],
            removedWalls: [],
          }

          set(s => ({
            rooms: [...s.rooms, room],
            selection: { kind: 'room', id },
            isDrawing: false,
            drawPoints: [],
          }))
          return id
        },

        setDragging: (dragging) => set({ isDragging: dragging }),

        // ── Room CRUD ──

        addRoom: (type) => {
          const cat = ROOM_TYPES.find(r => r.type === type) ?? ROOM_TYPES[0]
          const id = `room-${++roomCounter}-${Date.now()}`
          const color = ROOM_COLORS[get().rooms.length % ROOM_COLORS.length]
          const defaultWallColors: Record<string, string> = {
            salon: '#e3ddd4', yatak: '#eae2d8', mutfak: '#dde2d8',
            banyo: '#d8e2e8', koridor: '#e2dcd4', cocuk: '#eae8d8',
          }
          const room: Room = {
            id,
            type: cat.type as RoomType,
            widthCm: cat.wDef,
            lengthCm: cat.lDef,
            position: [(get().rooms.length * 1.2) % 6, 0],
            rotation: 0,
            color,
            wallColor: defaultWallColors[cat.type] ?? '#e3ddd4',
            wallColorOuter: '#c8c0b4',
            floorType: (cat.type === 'banyo' || cat.type === 'mutfak' ? 'fayans' : 'parke') as FloorType,
            openings: [],
            removedWalls: [],
          }
          set(s => ({
            rooms: [...s.rooms, room],
            selection: { kind: 'room', id },
          }))
          return id
        },

        updateRoom: (id, patch) => {
          set(s => ({
            rooms: s.rooms.map(r => r.id === id ? { ...r, ...patch } : r),
          }))
        },

        removeRoom: (id) => {
          set(s => ({
            rooms: s.rooms.filter(r => r.id !== id),
            furniture: s.furniture.map(f => f.parentRoomId === id ? { ...f, parentRoomId: null } : f),
            selection: s.selection.id === id ? { kind: null, id: null } : s.selection,
          }))
        },

        // ── Furniture CRUD ──

        addCustomFurniture: (label, modelUrl) => {
          const id = `furn-${++furnitureCounter}-${Date.now()}`
          const color = FURNITURE_COLORS[get().furniture.length % FURNITURE_COLORS.length]
          const item: FurnitureItem = {
            id,
            type: 'custom' as FurnitureType,
            dims: { scale: 100 },
            position: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
            rotation: 0,
            color,
            parentRoomId: null,
            customModelUrl: modelUrl,
            customLabel: label,
          }
          set(s => ({
            furniture: [...s.furniture, item],
            selection: { kind: 'furniture', id },
          }))
          return id
        },

        addFurniture: (type, variantOverride) => {
          const cat = FURNITURE_CATALOG.find(f => f.type === type)
          if (!cat) return ''
          const id = `furn-${++furnitureCounter}-${Date.now()}`
          const dims: Record<string, number> = {}
          cat.dimDefs.forEach(d => { dims[d.key] = d.def })
          const color = FURNITURE_COLORS[get().furniture.length % FURNITURE_COLORS.length]

          // Varyant seçimi: override > kullanıcı default > katalog ilk > undefined
          let chosenVariant: string | undefined
          if (cat.variants && cat.variants.length > 0) {
            chosenVariant = variantOverride
              ?? get().defaultVariants[type]
              ?? cat.variants[0].id
          }

          const item: FurnitureItem = {
            id,
            type: cat.type as FurnitureType,
            ...(chosenVariant ? { variant: chosenVariant } : {}),
            dims,
            position: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
            rotation: 0,
            color,
            parentRoomId: null,
          }
          set(s => ({
            furniture: [...s.furniture, item],
            selection: { kind: 'furniture', id },
          }))
          return id
        },

        updateFurniture: (id, patch) => {
          set(s => ({
            furniture: s.furniture.map(f => f.id === id ? { ...f, ...patch } : f),
          }))
        },

        removeFurniture: (id) => {
          set(s => ({
            furniture: s.furniture.filter(f => f.id !== id),
            selection: s.selection.id === id ? { kind: null, id: null } : s.selection,
          }))
        },

        // ── Selection ──

        select: (kind, id) => set({ selection: { kind, id } }),
        deselect: () => set({ selection: { kind: null, id: null } }),

        // ── Openings ──

        addOpening: (roomId, wall, type) => {
          const openingId = `opening-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const defaults: Record<string, { w: number; h: number; b: number }> = {
            'door':           { w: 90,  h: 210, b: 0  },
            'double-door':    { w: 160, h: 210, b: 0  },
            'sliding-door':   { w: 180, h: 210, b: 0  },
            'window':         { w: 120, h: 120, b: 90 },
            'panoramic':      { w: 220, h: 230, b: 0  },
            'triple-window':  { w: 240, h: 140, b: 80 },
            'french-balcony': { w: 120, h: 230, b: 0  },
          }
          const d = defaults[type] ?? defaults['window']
          const opening: WallOpening = {
            id: openingId,
            type,
            wall,
            positionAlongWall: 0.5,
            widthCm: d.w,
            heightCm: d.h,
            bottomCm: d.b,
          }
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId ? { ...r, openings: [...(r.openings ?? []), opening] } : r
            ),
          }))
        },

        removeOpening: (roomId, openingId) => {
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId
                ? { ...r, openings: (r.openings ?? []).filter(o => o.id !== openingId) }
                : r
            ),
          }))
        },

        updateOpening: (roomId, openingId, patch) => {
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId
                ? { ...r, openings: (r.openings ?? []).map(o => o.id === openingId ? { ...o, ...patch } : o) }
                : r
            ),
          }))
        },

        toggleWall: (roomId, wall) => {
          set(s => ({
            rooms: s.rooms.map(r => {
              if (r.id !== roomId) return r
              const removed = r.removedWalls ?? []
              const isRemoved = removed.includes(wall)
              return {
                ...r,
                removedWalls: isRemoved ? removed.filter(w => w !== wall) : [...removed, wall],
                // Remove openings on that wall when wall is removed
                openings: isRemoved ? (r.openings ?? []) : (r.openings ?? []).filter(o => o.wall !== wall),
              }
            }),
          }))
        },

        // ── Pin/Unpin ──

        pinToRoom: (furnitureId, roomId) => {
          set(s => ({
            furniture: s.furniture.map(f =>
              f.id === furnitureId ? { ...f, parentRoomId: roomId } : f
            ),
          }))
        },

        unpinFromRoom: (furnitureId) => {
          set(s => ({
            furniture: s.furniture.map(f =>
              f.id === furnitureId ? { ...f, parentRoomId: null } : f
            ),
          }))
        },

        // ── View ──

        setTopView: (isTop) => set({ isTopView: isTop }),

        // ── Layout ──

        exportLayout: () => ({
          version: 1,
          rooms: get().rooms,
          furniture: get().furniture,
        }),

        importLayout: (data) => {
          roomCounter = 0
          furnitureCounter = 0
          set({
            rooms: data.rooms,
            furniture: data.furniture,
            selection: { kind: null, id: null },
          })
        },

        clear: () => {
          roomCounter = 0
          furnitureCounter = 0
          set({
            rooms: [],
            furniture: [],
            selection: { kind: null, id: null },
          })
        },
      }),
      {
        // Only track rooms and furniture for undo/redo (not selection, dragging, view)
        partialize: (state) => ({
          rooms: state.rooms,
          furniture: state.furniture,
        }),
        limit: 50,
        // Skip duplicate states
        equality: (pastState, currentState) =>
          JSON.stringify(pastState) === JSON.stringify(currentState),
        // Don't track rapid drag movements - only capture on significant changes
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
      }),
    }
  )
)

// Export temporal store for undo/redo access
export const useTemporalStore = () => useDesignStore.temporal
