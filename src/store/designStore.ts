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

interface DesignState {
  rooms: Room[]
  furniture: FurnitureItem[]
  selection: Selection
  isTopView: boolean
  isDragging: boolean
  isDrawing: boolean
  showDimensions: boolean
  blueprintUrl: string | null
  blueprintScale: number       // metre/piksel ölçeği
  blueprintOpacity: number
  drawPoints: [number, number][]  // x, z world coords

  // Blueprint
  setBlueprint: (url: string | null) => void
  setBlueprintScale: (scale: number) => void
  setBlueprintOpacity: (opacity: number) => void

  // Dimensions
  toggleDimensions: () => void

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
  addFurniture: (type: FurnitureType) => string
  addCustomFurniture: (label: string, modelUrl: string) => string
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void

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
        blueprintUrl: null,
        blueprintScale: 10,
        blueprintOpacity: 0.5,
        drawPoints: [],

        setBlueprint: (url) => set({ blueprintUrl: url, isTopView: true }),
        setBlueprintScale: (scale) => set({ blueprintScale: scale }),
        setBlueprintOpacity: (opacity) => set({ blueprintOpacity: opacity }),

        toggleDimensions: () => set(s => ({ showDimensions: !s.showDimensions })),

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

        addFurniture: (type) => {
          const cat = FURNITURE_CATALOG.find(f => f.type === type)
          if (!cat) return ''
          const id = `furn-${++furnitureCounter}-${Date.now()}`
          const dims: Record<string, number> = {}
          cat.dimDefs.forEach(d => { dims[d.key] = d.def })
          const color = FURNITURE_COLORS[get().furniture.length % FURNITURE_COLORS.length]
          const item: FurnitureItem = {
            id,
            type: cat.type as FurnitureType,
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
          const isDoor = type === 'door'
          const opening: WallOpening = {
            id: openingId,
            type,
            wall,
            positionAlongWall: 0.5,
            widthCm: isDoor ? 90 : 120,
            heightCm: isDoor ? 210 : 120,
            bottomCm: isDoor ? 0 : 90,
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
      }),
    }
  )
)

// Export temporal store for undo/redo access
export const useTemporalStore = () => useDesignStore.temporal
