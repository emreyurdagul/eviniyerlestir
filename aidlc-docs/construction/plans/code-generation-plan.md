# Code Generation Plan - EviniYerlestir

## Genel Bilgi
- **Proje Tipi**: Greenfield monolith SPA
- **Workspace Root**: C:\Users\AIFTeam-12\Desktop\Modelle\eviniyerlestir
- **Kod Lokasyonu**: src/ (ASLA aidlc-docs/ degil)
- **Yaklasim**: Dalga bazli paralel (bagimliliklara gore sirali)

---

## DALGA 1: U1 Core (Types + Store + i18n)

- [x] Step 1: Proje yapilandirmasi (Tailwind, vite.config, index.html, global.css)
- [x] Step 2: Veri modelleri (src/types/index.ts) - Room, FurnitureItem, LayoutData, RoomType, FurnitureType, katalog tanimlari
- [x] Step 3: Zustand store (src/store/designStore.ts) - CRUD, secim, pin/unpin, persist middleware
- [x] Step 4: i18n altyapisi (src/i18n/index.ts + src/i18n/locales/tr.json)

**Hikayeler**: US-4.1 (localStorage persist)

---

## DALGA 2: U2 Scene + U5 UI + U6 Serialization (paralel)

### U2: 3D Scene
- [x] Step 5: SceneCanvas (src/components/Canvas/SceneCanvas.tsx) - R3F Canvas, isiklar, golge
- [x] Step 6: CameraControls (src/components/Canvas/CameraControls.tsx) - OrbitControls, top-view, touch
- [x] Step 7: Ground (src/components/Canvas/Ground.tsx) - Zemin duzlemi

**Hikayeler**: US-3.1 (3D gorunum), US-3.2 (top-view)

### U6: Serialization
- [x] Step 8: SerializationService (src/services/serialization.ts) - JSON export/import, schema validation, localStorage, dosya islemleri

**Hikayeler**: US-4.1 (localStorage), US-4.2 (JSON export), US-4.3 (JSON import)

### U5: UI Panels (temel iskelet)
- [x] Step 9: App.tsx - Ana layout (Canvas + paneller + responsive)
- [x] Step 10: Toolbar (src/components/UI/Toolbar.tsx) - Sol panel, oda/mobilya tab, katalog
- [x] Step 11: PropertiesPanel (src/components/UI/PropertiesPanel.tsx) - Sag panel, ozellikler, listeler
- [x] Step 12: BottomBar (src/components/UI/BottomBar.tsx) - Alt bar, araclar, secim badge

**Hikayeler**: US-5.1 (sol panel), US-5.2 (sag panel), US-5.3 (alt bar), US-5.4 (responsive)

---

## DALGA 3: U3 Room + U4 Furniture (paralel)

### U3: Room System
- [x] Step 13: RoomMesh (src/components/Room/RoomMesh.tsx) - Oda render, duvarlar, zemin, surtuntu, handle resize, surekleme, secim highlight

**Hikayeler**: US-1.1 (oda ekleme), US-1.2 (boyutlandirma), US-1.3 (konumlandirma), US-1.4 (dondurme), US-1.5 (silme)

### U4: Furniture System
- [x] Step 14: FurnitureRegistry (src/components/Furniture/registry.ts) - 12 tip kayit, katalog, bounding box
- [x] Step 15: useSelection hook (src/hooks/useSelection.ts) - Raycasting, hit-test, drag/resize state
- [x] Step 16: FurnitureItem (src/components/Furniture/FurnitureItem.tsx) - Wrapper, handle resize, surekleme
- [x] Step 17: Mobilya modelleri - Sofa, Chair, DiningChair, CoffeeTable, TVUnit, DiningTable, Bed (src/components/Furniture/models/)
- [x] Step 18: Mobilya modelleri - Wardrobe, Shelf, FloorLamp, Rug, Plant (src/components/Furniture/models/)

**Hikayeler**: US-2.1 (ekleme), US-2.2 (surekleme), US-2.3 (boyutlandirma), US-2.4 (dondurme), US-2.5 (silme), US-3.3 (secim)

---

## ENTEGRASYON

- [x] Step 19: App.tsx entegrasyon - tum component'leri birlestir, Room + Furniture sahneye bagla
- [x] Step 20: Son dokunuslar - package.json isim duzeltme, main.tsx temizlik, gereksiz Vite scaffold dosyalari sil

---

## Ozet

| Dalga | Uniteler | Step'ler | Hikayeler |
|-------|----------|----------|-----------|
| 1 | U1 Core | 1-4 | US-4.1 |
| 2 | U2+U5+U6 | 5-12 | US-3.1, US-3.2, US-4.1-4.3, US-5.1-5.4 |
| 3 | U3+U4 | 13-18 | US-1.1-1.5, US-2.1-2.5, US-3.3 |
| Int | Entegrasyon | 19-20 | Tum hikayelerin birlesimi |
| **Toplam** | **6 unite** | **20 step** | **20 hikaye** |
