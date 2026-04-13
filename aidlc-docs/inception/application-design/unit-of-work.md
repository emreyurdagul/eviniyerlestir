# EviniYerlestir - Unit of Work Tanimlari

## Proje Tipi: Monolith SPA
## Gelistirme Stratejisi: Paralel (bagimliliklara gore dalga bazli)

---

## U1: Core (Types + Store)
**Tip**: Temel modul (foundation)
**Dosyalar**:
- `src/types/index.ts` - Room, FurnitureItem, LayoutData, RoomType, FurnitureType
- `src/store/designStore.ts` - Zustand store (CRUD, secim, pin/unpin)
- `src/i18n/index.ts` - i18n altyapisi
- `src/i18n/locales/tr.json` - Turkce ceviriler

**Sorumluluklar**:
- Tum veri modellerini tanimla
- Zustand store: odalar, mobilyalar, secim, mobilya-oda iliskisi
- persist middleware (localStorage)
- i18n yapilandirmasi

**Bagimliligi**: Yok (temel unite)

---

## U2: 3D Scene
**Tip**: Render altyapisi
**Dosyalar**:
- `src/components/Canvas/SceneCanvas.tsx` - R3F Canvas, isiklar, golge
- `src/components/Canvas/CameraControls.tsx` - OrbitControls + top-view
- `src/components/Canvas/Ground.tsx` - Zemin duzlemi

**Sorumluluklar**:
- R3F Canvas kurulumu (antialias, shadow, pixelRatio)
- Isik sistemi (ambient + directional + point)
- OrbitControls (sinirli orbit, zoom, touch)
- Top-view / perspektif gecisi
- Zemin render

**Bagimliligi**: U1 (store'dan kamera state)

---

## U3: Room System
**Tip**: Ozellik modulu
**Dosyalar**:
- `src/components/Room/RoomMesh.tsx` - Oda 3D render + handle resize + surekleme

**Sorumluluklar**:
- Duvarlar, zemin, surtuntu render (tavan yok)
- 8 handle (4 kose + 4 kenar) gosterme/gizleme
- Handle surekleme → boyut degistirme (20-5000cm)
- Govde surekleme → pozisyon degistirme
- Secim highlight (wireframe)
- Dondurme (90 derece)

**Bagimliligi**: U1 (Room tipi, store), U2 (sahne icinde render)

---

## U4: Furniture System
**Tip**: Ozellik modulu
**Dosyalar**:
- `src/components/Furniture/registry.ts` - FurnitureRegistry
- `src/components/Furniture/FurnitureItem.tsx` - Genel wrapper (handle + surekleme)
- `src/components/Furniture/models/Sofa.tsx`
- `src/components/Furniture/models/Chair.tsx`
- `src/components/Furniture/models/DiningChair.tsx`
- `src/components/Furniture/models/CoffeeTable.tsx`
- `src/components/Furniture/models/TVUnit.tsx`
- `src/components/Furniture/models/DiningTable.tsx`
- `src/components/Furniture/models/Bed.tsx`
- `src/components/Furniture/models/Wardrobe.tsx`
- `src/components/Furniture/models/Shelf.tsx`
- `src/components/Furniture/models/FloorLamp.tsx`
- `src/components/Furniture/models/Rug.tsx`
- `src/components/Furniture/models/Plant.tsx`
- `src/hooks/useSelection.ts` - Secim + surekleme + resize hook

**Sorumluluklar**:
- 12 prosedural mobilya modeli
- FurnitureRegistry (tip kayit, katalog, bounding box)
- Handle-based resize (kose/kenar handle'lar)
- Govde surekleme
- useSelection hook (raycasting, hit-test, drag state)

**Bagimliligi**: U1 (FurnitureItem tipi, store), U2 (sahne icinde render)

---

## U5: UI Panels
**Tip**: Arayuz modulu
**Dosyalar**:
- `src/components/UI/Toolbar.tsx` - Sol panel (oda + mobilya katalogu)
- `src/components/UI/PropertiesPanel.tsx` - Sag panel (ozellikler + listeler)
- `src/components/UI/BottomBar.tsx` - Alt bar (araclar + secim badge)
- `src/styles/global.css` - Tailwind + global stiller
- `src/App.tsx` - Ana layout (paneller + canvas)

**Sorumluluklar**:
- Toolbar: oda/mobilya tab, katalog listesi, ekle butonlari
- PropertiesPanel: secili nesne boyut inputlari, oda/mobilya listesi
- BottomBar: dondur, gorunum, kaydet, yukle butonlari
- Responsive tasarim (masaustu/tablet/mobil)
- Panel ac/kapat toggle

**Bagimliligi**: U1 (store), U4 (registry - katalog bilgisi)

---

## U6: Serialization
**Tip**: Servis modulu
**Dosyalar**:
- `src/services/serialization.ts` - JSON export/import, schema validation, localStorage, dosya islemleri

**Sorumluluklar**:
- State → JSON donusumu
- JSON → State donusumu (schema dogrulama)
- JSON schema validation (Security Baseline)
- localStorage okuma/yazma
- Dosya indirme (.json)
- Dosya yukleme + parse

**Bagimliligi**: U1 (LayoutData tipi)

---

## Gelistirme Dalga Plani

```
Dalga 1 (Sirali):
  U1 Core ────────────────────────────►

Dalga 2 (Paralel - U1 tamamlandiktan sonra):
  U2 3D Scene ────────────►
  U5 UI Panels ───────────►
  U6 Serialization ───────►

Dalga 3 (Paralel - U1+U2 tamamlandiktan sonra):
  U3 Room System ─────────►
  U4 Furniture System ────►

Entegrasyon:
  App.tsx - tum uniteleri birlesit ──►
```

## Kod Organizasyonu

```
src/
├── types/index.ts                    [U1]
├── store/designStore.ts              [U1]
├── i18n/                             [U1]
├── components/
│   ├── Canvas/                       [U2]
│   ├── Room/                         [U3]
│   ├── Furniture/                    [U4]
│   │   ├── models/                   [U4]
│   │   └── registry.ts              [U4]
│   └── UI/                           [U5]
├── hooks/useSelection.ts             [U4]
├── services/serialization.ts         [U6]
├── styles/global.css                 [U5]
└── App.tsx                           [U5]
```
