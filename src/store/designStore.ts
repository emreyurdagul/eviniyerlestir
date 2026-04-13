import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Room, FurnitureItem, Selection, SelectionKind, LayoutData,
  RoomType, FurnitureType,
} from '../types'
import { ROOM_TYPES, FURNITURE_CATALOG, ROOM_COLORS, FURNITURE_COLORS } from '../types'

let roomCounter = 0
let furnitureCounter = 0

interface DesignState {
  rooms: Room[]
  furniture: FurnitureItem[]
  selection: Selection
  isTopView: boolean

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
    (set, get) => ({
      rooms: [],
      furniture: [],
      selection: { kind: null, id: null },
      isTopView: false,

      // ── Room CRUD ──

      addRoom: (type) => {
        const cat = ROOM_TYPES.find(r => r.type === type) ?? ROOM_TYPES[0]
        const id = `room-${++roomCounter}-${Date.now()}`
        const color = ROOM_COLORS[get().rooms.length % ROOM_COLORS.length]
        const room: Room = {
          id,
          type: cat.type as RoomType,
          widthCm: cat.wDef,
          lengthCm: cat.lDef,
          position: [(get().rooms.length * 1.2) % 6, 0],
          rotation: 0,
          color,
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
      name: 'eviniyerlestir-layout',
      partialize: (state) => ({
        rooms: state.rooms,
        furniture: state.furniture,
      }),
    }
  )
)
