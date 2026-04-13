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

  // Dragging
  setDragging: (dragging: boolean) => void

  // Room CRUD
  addRoom: (type: RoomType) => string
  updateRoom: (id: string, patch: Partial<Room>) => void
  removeRoom: (id: string) => void

  // Furniture CRUD
  addFurniture: (type: FurnitureType) => string
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void

  // Selection
  select: (kind: SelectionKind, id: string | null) => void
  deselect: () => void

  // Openings (doors/windows)
  addOpening: (roomId: string, wall: WallSide, type: OpeningType) => void
  removeOpening: (roomId: string, openingId: string) => void

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
              r.id === roomId ? { ...r, openings: [...r.openings, opening] } : r
            ),
          }))
        },

        removeOpening: (roomId, openingId) => {
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId
                ? { ...r, openings: r.openings.filter(o => o.id !== openingId) }
                : r
            ),
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
