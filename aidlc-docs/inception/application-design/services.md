# EviniYerlestir - Service Katmani

## Servis Mimarisi

Uygulama saf client-side oldugu icin geleneksel backend servisleri yok.
Servis katmani Zustand store + utility fonksiyonlarindan olusur.

```
UI Components (Toolbar, PropertiesPanel, BottomBar)
        |
        v
  DesignStore (Zustand) ←→ SerializationService
        |
        v
  3D Components (SceneCanvas, RoomMesh, FurnitureItem)
        |
        v
  FurnitureRegistry ←→ FurnitureModels
```

## Service 1: DesignStore (Zustand - Merkezi Orkestrator)

**Rol**: Tum uygulama state'inin tek kaynagi (single source of truth)
**Sorumluluklar**:
- Oda ve mobilya koleksiyonlarini yonetir
- Secim state'ini yonetir
- Mobilya-oda iliskisini yonetir (pin/unpin)
- State degisikliklerinde localStorage'a otomatik kaydeder (middleware)
- Tum CRUD islemleri burada merkezi olarak yapilir

**Middleware**:
- `persist` middleware: localStorage otomatik senkronizasyon
- `immer` middleware (Faz 2): immutable state guncelleme + undo/redo

## Service 2: SerializationService (Utility)

**Rol**: Veri format donusumleri ve dogrulama
**Sorumluluklar**:
- Layout state ↔ JSON donusumu
- JSON schema dogrulama (Security Baseline: SECURITY-01 uyumu icin input validation)
- Dosya indirme / yukleme islemi
- localStorage okuma/yazma

**Guvenlik**:
- `importFromJSON` her zaman schema validate eder
- Bilinmeyen alanlar atilir (whitelist yaklasimi)
- Boyut degerleri sinir kontrolunden gecer

## Service 3: FurnitureRegistry (Singleton)

**Rol**: Mobilya tip bilgisi deposu
**Sorumluluklar**:
- Mobilya tipleri ve konfigurasyonlarini saklar
- UI katalogu icin bilgi saglar (ikon, etiket, kategori)
- Bounding box hesaplama (handle pozisyonlari icin)
- Yeni mobilya tipi ekleme API'si (genisletilebilirlik)

## Veri Akisi

### Mobilya Ekleme
```
Toolbar (tik) → DesignStore.addFurniture(type) → FurnitureRegistry.get(type)
    → yeni FurnitureItem state'e eklenir → R3F sahne otomatik re-render
    → SerializationService.saveToStorage() (persist middleware)
```

### Handle Resize
```
FurnitureItem.onPointerDown (handle) → useSelection.handlePointerDown
    → onPointerMove: delta hesapla → DesignStore.updateFurniture(id, { dims })
    → FurnitureModel yeni boyutla re-render → persist middleware → localStorage
```

### JSON Import
```
BottomBar (Yukle tik) → dosya sec → FileReader.readAsText
    → SerializationService.importFromJSON(text) → schema validate
    → DesignStore.importLayout(data) → sahne yeniden olusturulur
```

### Odaya Sabitleme
```
PropertiesPanel "Odaya Sabitle" → DesignStore.pinToRoom(furnitureId, roomId)
    → mobilya.parentRoomId = roomId → oda tasindiginda mobilya da tasinir
```
