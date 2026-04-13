# EviniYerlestir - Application Design (Konsolide)

## Mimari Ozet

**Mimari Stil**: Component-based SPA (React + R3F)
**State Pattern**: Centralized store (Zustand) - single source of truth
**3D Etkilesim**: Handle-based resize + govde surekleme (endustri standardi)
**Mobilya-Oda Iliskisi**: Hibrit (varsayilan bagimsiz, opsiyonel odaya sabitleme)

## Component Haritasi (12 component)

```
+------------------------------------------------------+
|                      App.tsx                          |
|  +----------+  +----------------+  +--------------+  |
|  | Toolbar  |  | SceneCanvas    |  | Properties   |  |
|  | (Sol)    |  |                |  | Panel (Sag)  |  |
|  |          |  | +CameraCtrl   |  |              |  |
|  | Oda tab  |  | +Ground       |  | Secili nesne |  |
|  | Mob. tab |  | +RoomMesh[]   |  | Oda listesi  |  |
|  +----------+  | +FurnItem[]   |  | Mob. listesi |  |
|                |  (useSelect)  |  +--------------+  |
|                +----------------+                    |
|  +------------------------------------------------+  |
|  |              BottomBar                          |  |
|  | Dondur | Gorunum | Kaydet | Yukle | Secim Info |  |
|  +------------------------------------------------+  |
+------------------------------------------------------+
```

## Katmanlar

### UI Katmani (React + Tailwind)
- `Toolbar` - Sol panel: oda + mobilya katalogu, tab gecisi
- `PropertiesPanel` - Sag panel: boyut inputlari, listeler
- `BottomBar` - Alt bar: araclar + secim badge

### 3D Katmani (React Three Fiber)
- `SceneCanvas` - R3F Canvas, isiklar, golge
- `CameraControls` - OrbitControls + top-view
- `RoomMesh` - Oda render + handle resize + surekleme
- `FurnitureItem` - Mobilya render + handle resize + surekleme
- `FurnitureModel/*` - 12+ prosedural 3D model

### State Katmani (Zustand)
- `DesignStore` - Merkezi state (odalar, mobilyalar, secim)
- `useSelection` - Secim + surekleme + resize hook

### Servis Katmani (Utility)
- `FurnitureRegistry` - Mobilya tip deposu
- `SerializationService` - JSON import/export + localStorage + schema validation

## Dosya Yapisi

```
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── Canvas/
│   │   ├── SceneCanvas.tsx
│   │   ├── CameraControls.tsx
│   │   └── Ground.tsx
│   ├── Room/
│   │   └── RoomMesh.tsx
│   ├── Furniture/
│   │   ├── FurnitureItem.tsx
│   │   ├── models/
│   │   │   ├── Sofa.tsx
│   │   │   ├── Chair.tsx
│   │   │   ├── DiningChair.tsx
│   │   │   ├── CoffeeTable.tsx
│   │   │   ├── TVUnit.tsx
│   │   │   ├── DiningTable.tsx
│   │   │   ├── Bed.tsx
│   │   │   ├── Wardrobe.tsx
│   │   │   ├── Shelf.tsx
│   │   │   ├── FloorLamp.tsx
│   │   │   ├── Rug.tsx
│   │   │   └── Plant.tsx
│   │   └── registry.ts
│   └── UI/
│       ├── Toolbar.tsx
│       ├── PropertiesPanel.tsx
│       └── BottomBar.tsx
├── hooks/
│   └── useSelection.ts
├── store/
│   └── designStore.ts
├── services/
│   └── serialization.ts
├── types/
│   └── index.ts
├── i18n/
│   ├── index.ts
│   └── locales/
│       └── tr.json
└── styles/
    └── global.css
```

## Veri Modelleri

```ts
interface Room {
  id: string
  type: RoomType           // 'salon' | 'yatak' | 'mutfak' | 'banyo' | 'koridor' | 'cocuk'
  widthCm: number          // 20 - 5000
  lengthCm: number         // 20 - 5000
  position: [number, number]  // x, z (metre)
  rotation: number            // radyan
  color: number               // hex
}

interface FurnitureItem {
  id: string
  type: FurnitureType
  dims: Record<string, number>  // tip'e ozel boyutlar (cm)
  position: [number, number]    // x, z (metre)
  rotation: number              // radyan
  color: number                 // hex
  parentRoomId: string | null   // hibrit iliski: null = bagimsiz
}

interface LayoutData {
  version: number
  rooms: Room[]
  furniture: FurnitureItem[]
}
```

## 3D Etkilesim Modeli

### Handle-Based Resize
- Mobilya/oda secildiginde 8 handle gorunur (4 kose + 4 kenar)
- Handle'lar kucuk kure/kutu seklinde, opak renkte
- Handle'a tikla-surukle → boyut degisir (delta hesaplama)
- Govdeye tikla-surukle → pozisyon degisir
- Alt bar "Dondur" butonu → 90 derece rotasyon

### Handle Gorunumu
```
    [H]----[H]----[H]
    |               |
   [H]   (govde)  [H]
    |               |
    [H]----[H]----[H]
```
- Kose handle: iki eksen ayni anda (orantili veya bagimsiz)
- Kenar handle: tek eksen (genislik veya derinlik)

## Teknoloji Detaylari

| Katman | Kutuphane | Versiyon |
|--------|-----------|----------|
| UI Framework | React | 18.x |
| Language | TypeScript | 5.x |
| 3D Engine | @react-three/fiber | 8.x |
| 3D Helpers | @react-three/drei | 9.x |
| State | Zustand | 5.x |
| CSS | Tailwind CSS | 4.x |
| Build | Vite | 6.x |
| i18n | react-i18next | (altyapi) |
