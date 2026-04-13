# EviniYerlestir - Component Tanimlari

## 1. SceneCanvas
**Amac**: React Three Fiber Canvas wrapper - 3D sahne, isiklar, kamera, zemin
**Sorumluluklar**:
- R3F Canvas olusturma ve yapilandirma
- Isik sistemi (ambient, directional, point)
- Golge haritasi yapilandirmasi
- Zemin duzlemi render
- Resize dinleyici

## 2. CameraControls
**Amac**: Kamera navigasyonu - orbit, zoom, top-view gecisi
**Sorumluluklar**:
- Orbit kontrolu (fare surekleme / iki parmak)
- Zoom (mouse wheel / pinch)
- Top-view / perspektif toggle
- Kamera sinir kontrolu (min/max mesafe, aci)
- Touch gesture desteyi

## 3. RoomMesh
**Amac**: Tek bir odanin 3D goruntulenmesi
**Sorumluluklar**:
- Duvarlar, zemin render (tavan yok - kamera gorsunu)
- Surtuntu (baseboard) render
- Boyutlandirma handle'lari gosterme (kenar handle'lar)
- Handle surekleme ile boyut degistirme
- Secim highlight (wireframe kutu)
- Surekleme (pozisyon degistirme)
- Dondurme

## 4. FurnitureItem
**Amac**: Tek bir mobilyanin 3D goruntulenmesi ve etkilesimi
**Sorumluluklar**:
- Mobilya modelini render (registry'den)
- Boyutlandirma handle'lari (kose/kenar kutular)
- Handle surekleme ile boyut degistirme
- Govde surekleme ile pozisyon degistirme
- Secim highlight
- Dondurme

## 5. FurnitureModel (Sofa, Chair, Bed, vb.)
**Amac**: Tek bir mobilya tipinin prosedural 3D modeli
**Sorumluluklar**:
- Geometri olusturma (boyut parametrelerine gore)
- Material uygulama
- Boyut degisikliginde yeniden olusturma
- 12+ tip: Sofa, Chair, DiningChair, CoffeeTable, TVUnit, DiningTable, Bed, Wardrobe, Shelf, FloorLamp, Rug, Plant

## 6. FurnitureRegistry
**Amac**: Mobilya tiplerinin merkezi kayit sistemi
**Sorumluluklar**:
- Tip → component eslestirmesi
- Varsayilan boyutlar, min/max sinirlar
- Bounding box hesaplama
- Yeni tip ekleme API'si
- Katalog bilgisi (ikon, etiket, boyut parametreleri)

## 7. Toolbar (Sol Panel)
**Amac**: Oda ve mobilya ekleme katalogu
**Sorumluluklar**:
- "Oda" / "Mobilya" tab gecisi
- Oda tipleri listesi (ikon + etiket)
- Mobilya tipleri listesi (ikon + etiket)
- Tikla → sahneye ekle
- Panel ac/kapat toggle

## 8. PropertiesPanel (Sag Panel)
**Amac**: Secili nesne ozellikleri ve sahne listesi
**Sorumluluklar**:
- Secili oda: tip, en, boy input alanlari
- Secili mobilya: tip-ozel boyut input alanlari
- Oda listesi (renk nokta + ikon + isim + sil butonu)
- Mobilya listesi
- Panel ac/kapat toggle

## 9. BottomBar
**Amac**: Hizli erisim araclari
**Sorumluluklar**:
- Dondur butonu (secili nesne varsa aktif)
- Gorunum degistir (3D / ustten)
- Kaydet (JSON export)
- Yukle (JSON import)
- Secim badge (secili nesne bilgisi)

## 10. DesignStore (Zustand)
**Amac**: Merkezi uygulama state'i
**Sorumluluklar**:
- Oda koleksiyonu CRUD
- Mobilya koleksiyonu CRUD
- Secim state'i (secili nesne tipi + id)
- Layout serialization/deserialization
- localStorage senkronizasyonu

## 11. SelectionManager
**Amac**: Secim ve handle etkilesim yonetimi
**Sorumluluklar**:
- Raycasting ile tiklanilan nesneyi belirleme
- Secim durumu yonetimi
- Handle hit-test (boyutlandirma mi, surekleme mi?)
- Deselect (bos alana tiklama)

## 12. SerializationService
**Amac**: Layout veri kayit/yukleme
**Sorumluluklar**:
- State → JSON donusumu
- JSON → State donusumu (schema dogrulama ile)
- localStorage okuma/yazma
- Dosya indirme / yukleme
- JSON schema validation (Security Baseline)
