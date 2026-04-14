# Cycle 3 — Application Design
## Konu: Mod Tabanlı Boyutlandırma + Kapı/Pencere Sistemi

---

## 1. Veri Modeli Değişiklikleri

### 1.1 `SelectionKind` — Açıklık Seçimi Eklendi
```typescript
// types/index.ts (MEVCUT)
export type SelectionKind = 'room' | 'furniture' | null

// YENİ
export type SelectionKind = 'room' | 'furniture' | 'opening' | null

export interface Selection {
  kind: SelectionKind
  id: string | null
  parentId?: string | null   // 'opening' türü için: roomId
}
```

### 1.2 `OpeningType` — Yeni Tipler
```typescript
// types/index.ts (MEVCUT)
export type OpeningType = 'door' | 'window'

// YENİ
export type OpeningType =
  | 'door'            // Tek kanatlı kapı (mevcut)
  | 'double-door'     // Çift kanatlı kapı
  | 'sliding-door'    // Sürgülü kapı
  | 'window'          // Standart pencere (mevcut)
  | 'panoramic'       // Boydan boya / panoramik pencere
  | 'triple-window'   // Kademeli / üç bölümlü pencere
  | 'french-balcony'  // Fransız balkon
```

Varsayılan boyutlar (`addOpening` içinde):
| Tip | Genişlik | Yükseklik | Tabandan |
|-----|----------|-----------|---------|
| door | 90 cm | 210 cm | 0 cm |
| double-door | 160 cm | 210 cm | 0 cm |
| sliding-door | 90 cm | 210 cm | 0 cm |
| window | 120 cm | 120 cm | 90 cm |
| panoramic | *duvar genişliği* | 180 cm | 20 cm |
| triple-window | *duvar genişliği* | 140 cm | 90 cm |
| french-balcony | 90 cm | 220 cm | 0 cm |

### 1.3 Store — `editMode` Eklendi
```typescript
// store/designStore.ts
editMode: 'move' | 'resize'          // varsayılan: 'move'
toggleEditMode: () => void
selectOpening: (id: string, roomId: string) => void
```

---

## 2. Bileşen Mimarisi

### 2.1 Yeni Bileşenler

#### `RoomResizeHandles.tsx`
- **Konum**: `src/components/Room/RoomResizeHandles.tsx`
- **Amaç**: Boyutlandır modunda oda için duvar + köşe handle'ları
- **Props**: `{ room: Room }`
- **Render Koşulu**: `editMode === 'resize' && isSelected`

Handle pozisyonları (odanın local space'inde, rotation'sız):
```
Duvar ortası:  (+hw+δ, h*0.5, 0)   sağ duvar
               (-hw-δ, h*0.5, 0)   sol duvar
               (0, h*0.5, +hl+δ)   ön duvar
               (0, h*0.5, -hl-δ)   arka duvar

Köşeler:       (+hw+δ, h*0.5, +hl+δ)  sağ-ön
               (+hw+δ, h*0.5, -hl-δ)  sağ-arka
               (-hw-δ, h*0.5, +hl+δ)  sol-ön
               (-hw-δ, h*0.5, -hl-δ)  sol-arka
               (δ = 0.10 m offset)
```

Asimetrik resize formülü (tek duvar):
```
// Sağ duvar handle — localDx > 0 genişletir, sol duvar sabit
newWidthM  = startWidthM + localDx
newPosX    = startPosX + localDx / 2

// Sol duvar handle — localDx < 0 genişletir (negatif), sağ duvar sabit
newWidthM  = startWidthM - localDx
newPosX    = startPosX + localDx / 2

// Ön duvar handle — localDz > 0 genişletir
newLengthM = startLengthM + localDz
newPosZ    = startPosZ + localDz / 2

// Arka duvar handle — localDz < 0 genişletir
newLengthM = startLengthM - localDz
newPosZ    = startPosZ + localDz / 2
```

Köşe resize (ikili eksen — iki komşu duvar):
```
// Sağ-Ön köşe: sağ duvar + ön duvar hareket eder
newWidthM  = startWidthM + localDx
newPosX    = startPosX + localDx / 2
newLengthM = startLengthM + localDz
newPosZ    = startPosZ + localDz / 2
```

Proximity algılama (handle'sız alana tıklanınca):
```
// Tıklama noktası (localX, localZ) — odanın local koordinatlarında
distToRightWall  = |localX - hw|
distToLeftWall   = |localX + hw|
distToFrontWall  = |localZ - hl|
distToBackWall   = |localZ + hl|
distToCorners    = min(köşeye uzaklıklar)

threshold = min(hw, hl) * 0.3   // odanın küçük boyutunun %30'u

if distToCorners < threshold → köşe resize (en yakın köşe)
else if minWallDist < threshold → o duvarı resize et
else → taşıma modu davranışı (move modundaysa)
```

#### `OpeningHandles.tsx`
- **Konum**: `src/components/Room/OpeningHandles.tsx`
- **Amaç**: Seçili açıklığı (kapı/pencere) 3D canvas üzerinde boyutlandırma
- **Props**: `{ opening: WallOpening; wallLength: number; wallHeight: number; wallThickness: number; onUpdate: (patch: Partial<WallOpening>) => void }`
- **Handle'lar**:
  - Sol kenar: `positionAlongWall` küçültür (açıklığı sola genişletir)
  - Sağ kenar: `positionAlongWall` büyütür (açıklığı sağa genişletir)
  - Üst kenar: `heightCm` büyütür
  - Orta (konum): `positionAlongWall` kaydırır

---

### 2.2 Değiştirilen Bileşenler

#### `RoomMesh.tsx` — Mod Farkındalığı
```
editMode === 'move':
  - Mevcut davranış (body drag = taşı)
  - Handle'lar görünmez
  - RoomResizeHandles render edilmez

editMode === 'resize':
  - Body drag devre dışı (kazara taşıma önlenir)
  - RoomResizeHandles render edilir (seçiliyse)
  - Proximity algılama aktif (body tıklaması handle'a yönlendirilir)
  - OpeningHandles render edilir (açıklık seçiliyse)
```

#### `FurnitureItem.tsx` — Mod Farkındalığı
```
editMode === 'move':
  - Mevcut drag davranışı
  - Handle'lar gizli

editMode === 'resize':
  - Body drag = taşıma YOK (kazara taşıma önlenir)
  - Handle'lar görünür (mevcut kenar + köşe handle sistemi)
  - Handle sürükleme = boyutlandırma
```

#### `WallWithOpenings.tsx` — Yeni Tipler
Yeni tiplerin render stratejisi:
| Tip | Render Yaklaşımı |
|-----|-----------------|
| `panoramic` | Tek büyük cam mesh (şeffaf mavi, tam açıklık) |
| `triple-window` | Üç eşit bölüm cam + iki dikey profil |
| `french-balcony` | Alt kapalı panel + üst cam (bottomCm kadar) |
| `double-door` | İki eşit kanat — her biri ayrı mesh |
| `sliding-door` | Tek kanat + üst ray çizgisi |

#### `BottomBar.tsx` — Mod Butonu
- Mevcut butonların yanına mod toggle eklenir
- **Taşı** modu: ikon `↔` aktif renk
- **Boyutlandır** modu: ikon `⊞` aktif renk  
- M klavye kısayolu App.tsx'te tanımlanır

#### `PropertiesPanel.tsx` — Açıklık Bölümü
Seçim `opening` türündeyken yeni bölüm belirir:
```
┌─ Pencere / Kapı ──────────────────┐
│ Tip: [dropdown]                   │
│ Genişlik:  [___] cm               │
│ Yükseklik: [___] cm               │
│ Tabandan:  [___] cm               │
│ [Kaldır]                          │
└───────────────────────────────────┘
```

---

## 3. Uygulama Dalgaları

### Dalga 1 — Mod Sistemi (Store + UI)
- [ ] `designStore.ts`: `editMode`, `toggleEditMode`, `selectOpening` ekle
- [ ] `types/index.ts`: SelectionKind + Selection güncelle
- [ ] `BottomBar.tsx`: Taşı/Boyutlandır mod butonu
- [ ] `App.tsx`: M klavye kısayolu
- [ ] `RoomMesh.tsx`: editMode'a göre body drag aç/kapat
- [ ] `FurnitureItem.tsx`: editMode'a göre drag + handle görünürlüğü

### Dalga 2 — Oda Asimetrik Resize
- [ ] `RoomResizeHandles.tsx`: bileşen yaz
- [ ] Duvar handle'ları (4 adet): asimetrik resize formülü
- [ ] Köşe handle'ları (4 adet): dual-axis resize
- [ ] Proximity algılama: body tıklaması → en yakın handle
- [ ] `RoomMesh.tsx`: RoomResizeHandles mount et

### Dalga 3 — Yeni Açıklık Tipleri
- [ ] `types/index.ts`: OpeningType genişlet, varsayılan boyutlar
- [ ] `designStore.ts`: addOpening varsayılan boyutları güncelle
- [ ] `WallWithOpenings.tsx`: panoramic, triple-window, french-balcony, double-door, sliding-door render
- [ ] `PropertiesPanel.tsx`: tip seçici dropdown (açıklık seçiliyken)

### Dalga 4 — Açıklık Boyutlandırma
- [ ] `OpeningHandles.tsx`: sol/sağ/üst/orta 3D handle'lar
- [ ] `RoomMesh.tsx`: OpeningHandles mount et (açıklık seçiliyken)
- [ ] `PropertiesPanel.tsx`: genişlik/yükseklik/tabandan cm girişleri
- [ ] `designStore.ts`: selectOpening ile parentId yönetimi

---

## 4. Dokunulmayan Bileşenler
- `SceneCanvas`, `Compass`, `SunLight`, `DimensionLabels`: değişmez
- `services/ai/*`: değişmez
- `hooks/useAutoPin`, `hooks/useTouchGestures`: değişmez
- `Furniture/` model bileşenleri: değişmez
