# EviniYerlestir - Component Method Tanimlari

## DesignStore (Zustand)

```ts
// Oda CRUD
addRoom(type: RoomType): string              // Yeni oda ekle, id dondur
updateRoom(id: string, patch: Partial<Room>): void  // Oda guncelle (boyut, konum, rotasyon)
removeRoom(id: string): void                 // Oda sil
getRooms(): Room[]                           // Tum odalari getir

// Mobilya CRUD
addFurniture(type: FurnitureType): string    // Yeni mobilya ekle, id dondur
updateFurniture(id: string, patch: Partial<FurnitureItem>): void
removeFurniture(id: string): void
getFurniture(): FurnitureItem[]

// Secim
select(kind: 'room' | 'furniture', id: string): void
deselect(): void
getSelection(): { kind: string | null, id: string | null }

// Mobilya-Oda iliskisi (hibrit)
pinToRoom(furnitureId: string, roomId: string): void    // Odaya sabitle
unpinFromRoom(furnitureId: string): void                // Sabitlemeyi kaldir

// Serialization
exportLayout(): LayoutData
importLayout(data: LayoutData): void
saveToLocalStorage(): void
loadFromLocalStorage(): void
```

## FurnitureRegistry

```ts
register(type: string, config: FurnitureConfig): void
get(type: string): FurnitureConfig | undefined
getAll(): FurnitureConfig[]
getCatalog(): CatalogEntry[]       // UI icin ikon, etiket, kategori
getBoundingBox(type: string, dims: Record<string, number>): { w: number, h: number, d: number }
```

## CameraControls

```ts
// R3F component props
interface CameraControlsProps {
  isTopView: boolean
  onToggleView: () => void
  minDistance?: number       // default: 3
  maxDistance?: number       // default: 30
  minPolarAngle?: number    // default: 0.08
  maxPolarAngle?: number    // default: PI/2 - 0.04
}
```

## RoomMesh

```ts
interface RoomMeshProps {
  room: Room
  isSelected: boolean
  onPointerDown: (e: ThreeEvent) => void
  onHandleResize: (axis: 'w' | 'l', delta: number) => void
}
```

## FurnitureItem

```ts
interface FurnitureItemProps {
  item: FurnitureItem
  isSelected: boolean
  onPointerDown: (e: ThreeEvent) => void
  onHandleResize: (key: string, delta: number) => void
}
```

## SelectionManager (hook: useSelection)

```ts
interface UseSelectionReturn {
  handlePointerDown: (e: ThreeEvent, kind: 'room' | 'furniture', id: string) => void
  handlePointerMove: (e: ThreeEvent) => void
  handlePointerUp: () => void
  handleCanvasClick: (e: ThreeEvent) => void  // bos alan → deselect
  isDragging: boolean
  isResizing: boolean
  activeHandle: string | null
}
```

## SerializationService

```ts
exportToJSON(store: DesignStore): string           // State → JSON string
importFromJSON(json: string): LayoutData           // JSON string → validated LayoutData (throws on invalid)
validateSchema(data: unknown): data is LayoutData  // JSON schema dogrulama
saveToStorage(data: LayoutData): void              // localStorage yazma
loadFromStorage(): LayoutData | null               // localStorage okuma
downloadFile(json: string, filename: string): void // Dosya indirme
```
