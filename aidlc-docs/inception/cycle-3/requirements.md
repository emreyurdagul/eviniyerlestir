# Cycle 3 — Gereksinimler
## Konu: Mod Tabanlı Boyutlandırma + Kapı/Pencere Sistemi

---

## FR-A: Mod Tabanlı Etkileşim Sistemi

### FR-A1: Taşı / Boyutlandır Mod Butonu
- Canvas üzerinde kalıcı görünür mod butonu (BottomBar veya üst alanda)
- **M** klavye kısayolu ile geçiş
- Varsayılan başlangıç modu: **Taşı**
- Aktif mod net görsel gösterge ile belirtilir (renk, ikon değişimi)
- Mod oda ve mobilya için aynı anda geçerlidir

### FR-A2: Taşı Modu (Mevcut Davranış)
- Sol tık + sürükle → oda veya mobilyayı taşır
- Handle'lar görünmez
- Snap sistemi çalışmaya devam eder

### FR-A3: Boyutlandır Modu — Handle Sistemi
- Seçili oda/mobilyanın tüm handle'ları belirir:
  - **Duvar ortası handle'ları** (4 adet): her duvarın orta noktasında ok işareti
  - **Köşe handle'ları** (4 adet): her köşede kare/elmas işareti
- Handle görsel boyutları mevcut sistemden daha büyük (tıklama kolaylığı)
- Seçim olmadan handle görünmez

### FR-A4: Tek Duvar Boyutlandırma (Asimetrik)
- Duvar ortası handle'ına tıkla + sürükle → **sadece o duvar** hareket eder
- Karşı duvar sabit kalır (ayna/simetrik büyütme YOKTUR)
- Minimum boyut: 20 cm, maksimum: 5000 cm

### FR-A5: Proximity-Based Algılama
- Boyutlandır modunda, handle'sız oda yüzeyine tıklayıp sürükleyince:
  - Tıklama noktası duvar ortasına yakınsa → o duvarı boyutlandırır (FR-A4 davranışı)
  - Tıklama noktası köşeye yakınsa → FR-A6 köşe davranışı
- Yakınlık eşiği: en yakın handle'ın yarı mesafesi

### FR-A6: Köşe Boyutlandırma (İkili Eksen)
- Köşe handle'ına tıkla + sürükle → **iki ekseni birden** büyütür/küçültür
- Köşenin bulunduğu iki duvar birlikte hareket eder; diğer iki duvar sabit
- Mobilyada mevcut olan köşe handle sistemiyle aynı mantık

---

## FR-B: Kapı ve Pencere Sistemi İyileştirmeleri

### FR-B1: Yeni Pencere Tipleri
Mevcut "standart" pencereye ek olarak:

| Tip | Açıklama | Başlangıç Boyutu |
|-----|----------|-----------------|
| **Standart** | Mevcut, korunur | Kullanıcı tanımlı |
| **Boydan Boya (Panoramik)** | Başlangıçta tüm duvarı kaplar; genişlik+yükseklik ayarlanabilir | Duvar genişliği × 180 cm yükseklik |
| **Kademeli (Üç Bölümlü)** | Ortada sabit panel, iki yanda açılır bölüm; görsel olarak 3 cam | Duvar genişliği × 140 cm |
| **Fransız Balkon** | Alt 90 cm kapalı duvar, üstü camdan balkon korkuluğu; kapı gibi açılır | 90 cm genişlik × 220 cm yükseklik |

### FR-B2: Yeni Kapı Tipleri
Mevcut tek kanatlı kapıya ek olarak:

| Tip | Açıklama | Varsayılan Boyut |
|-----|----------|-----------------|
| **Tek Kanatlı** | Mevcut, korunur | 90 × 210 cm |
| **Çift Kanatlı** | İki kanatlı, ortadan açılır; 3D'de iki kanat gösterilir | 160 × 210 cm |
| **Sürgülü** | Yatay kayan kanat; 3D'de ray çizgisi ile gösterilir | 90 × 210 cm |

### FR-B3: Açıklık Boyutlandırma — Canvas Handle
- Boyutlandır modunda seçili kapı/pencere üzerinde handle'lar belirir:
  - **Genişlik handle'ı**: açıklığın sol ve sağ kenarında
  - **Yükseklik handle'ı**: açıklığın üst kenarında
  - **Konum handle'ı**: açıklığın ortasında (duvar boyunca kaydırma)
- Sürükleme ile anlık güncelleme; bırakınca store'a yazılır

### FR-B4: Açıklık Boyutlandırma — PropertiesPanel
- Seçili kapı/pencere için panel genişler:
  - Genişlik (cm) — sayı girişi
  - Yükseklik (cm) — sayı girişi
  - Tabandan yükseklik (cm) — sayı girişi (kapılarda 0, pencerede 90 varsayılan)
- Enter veya blur ile anlık güncelleme

---

## Kapsam Dışı (Bu Cycle)
- Kapı/pencere animasyonu (açılma kapanma)
- Duvar malzeme/doku desteği
- Çoklu açıklık aynı anda seçimi

---

## Etkilenen Dosyalar (Tahmini)
| Dosya | Değişim Nedeni |
|-------|---------------|
| `src/store/designStore.ts` | `editMode: 'move' \| 'resize'` state + toggle |
| `src/types/index.ts` | `OpeningType` genişletme (panoramic, triple, french-balcony, double-door, sliding-door) |
| `src/components/Room/RoomMesh.tsx` | Mod farkındalığı, handle görünürlüğü, proximity algılama |
| `src/components/Room/WallWithOpenings.tsx` | Yeni açıklık tipleri render |
| `src/components/UI/BottomBar.tsx` | Mod butonu ekleme |
| `src/components/UI/PropertiesPanel.tsx` | Açıklık boyut girişleri |
| `src/components/Room/OpeningHandles.tsx` | Yeni bileşen — açıklık canvas handle'ları |
