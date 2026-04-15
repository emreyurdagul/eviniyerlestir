# EviniYerlestir — Proje Durum Raporu

> **Tarih:** 2026-04-15  
> **Branch:** `main` (69336e1)  
> **Kapsam:** 121 dosya · ~14 800 satır TypeScript/TSX  
> **Versiyon:** 0.1.0 (pre-release)

---

## İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Mevcut Durum — Tamamlananlar](#2-mevcut-durum--tamamlananlar)
3. [Bug Raporu](#3-bug-raporu)
4. [Yapılacaklar — Özellik Boşlukları](#4-yapılacaklar--özellik-boşlukları)
5. [Teknik Borç Kalanı](#5-teknik-borç-kalanı)
6. [Performans Notları](#6-performans-notları)
7. [Test Kapsamı Analizi](#7-test-kapsamı-analizi)
8. [Mimari Kararlar & Notlar](#8-mimari-kararlar--notlar)
9. [Sürüm Yol Haritası Önerisi](#9-sürüm-yol-haritası-önerisi)

---

## 1. Proje Genel Bakış

EviniYerlestir, tarayıcı tabanlı 3D ev planlama aracıdır.  
Hedef kullanıcı: teknik olmayan ev sahibi (masaüstü + mobil).

### Teknoloji Yığını

| Katman | Araç | Versiyon |
|---|---|---|
| UI Framework | React | 19.2.4 |
| 3D Engine | Three.js + @react-three/fiber | 0.183 / 9.5 |
| Stil | Tailwind CSS | 4.2 |
| State | Zustand + Zundo (undo/redo) | 5.0 / 2.3 |
| AI | Anthropic Claude SDK | 0.88 |
| Doğrulama | Zod | 4.3 |
| Build | Vite 8 + Rolldown | — |
| Test | Vitest | 4.1 |

### Temel Özellikler

- 3D oda oluşturma (7 oda tipi, özelleştirilebilir boyut/renk/zemin)
- Mobilya kataloğu (30+ tip, 40+ varyant, GLTF modeller)
- Duvar açıklıkları (kapı, pencere, panoramik, fransız balkon…)
- AI asistanı: plan üretme, yerleşim önerisi, tarz analizi, fotoğraf analizi, kroki okuma
- 2D kat planı görünümü
- Aydınlatma sistemi (Kelvin, lüks tahmini)
- Hazır şablon galerisi (stüdyo → 3+1)
- Onboarding (Welcome modal + 5 adım tur)
- Yardım paneli + klavye kısayolları
- JSON kaydet/yükle/paylaş (URL hash)
- Undo/redo (50 adım)
- Dokunmatik jest desteği

---

## 2. Mevcut Durum — Tamamlananlar

### 2.1 Faz 1–4 — Temel Özellikler (commit geçmişinden)

| Commit | Kapsam |
|---|---|
| `6e7121b` | RoomMesh + FurnitureItem sürükleme/boyutlandırma — window listener |
| `f3a639d` | Aydınlatma sistemi + duvar sağ-tık context menüsü |
| `b2c6e3b` | 10 yeni mobilya varyantı, model detayları |
| `07acf3f` | Tavan lambası konumlandırma düzeltmesi + Genel Ayarlar paneli |
| `9d85e7f` | UX paketi: Toast, Preset Galerisi, Yardım, Tur, Mobil, Empty State |
| `9336700` | Safety net + DRY altyapısı + component split |
| `4a7ded9` | Type safety + designStore dekomposizyonu |

### 2.2 Faz 5 — Teknik Borç Eliminasyonu (tamamlandı)

| Faz | Commit | Etki |
|---|---|---|
| 5.1 Dead code purge | `22fa31d` | 1 dosya silme, 10+ gereksiz export kaldırıldı |
| 5.2 three-stdlib dep | `b17f769` | Transitif bağımlılık doğrudan tanımlandı |
| 5.3 Lazy-load | `7bbd933` | Ana chunk 1 150 → 917 KB (−20 %) |
| 5.4 Store testleri | `7267fa8` | Test sayısı 78 → 126 (+48) |
| 5.5 WallWithOpenings parçalama | `4fdabcb` | 496 satır → 140 satır + 2 modül, +7 test |
| 5.6 i18n kaldırma + HMR fix | `588ca99` | i18next bağımlılığı kaldırıldı, 917 → 868 KB |
| 5.7 Lint cleanup | `1cdc933` | 0 ESLint hatası/uyarı, suppression'lar belgelendi |
| Knip sıfırlama | `69336e1` | 0 ölü dosya/export/tip |

### 2.3 Kalite Göstergeleri (güncel)

```
tsc -b --noEmit   →  0 hata
eslint .          →  0 hata, 0 uyarı
knip              →  0 ölü dosya / export / tip
vitest run        →  133 / 133 geçti (8 test dosyası)
vite build        →  868 KB main (gzip 257 KB)  ✓
```

---

## 3. Bug Raporu

Öncelik skalası: 🔴 Kritik · 🟠 Yüksek · 🟡 Orta · 🟢 Düşük

---

### 3.1 Store / Veri Katmanı

#### BUG-001 🟠 — Mobilya spawn pozisyonu sahne dışına düşebilir
**Dosya:** `src/store/factories.ts` ~ satır 153  
**Sorun:**
```typescript
position: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
```
Mobilya `[-1, 1] × [-1, 1]` metre aralığında rastgele spawn edilir. Sahnede henüz oda yoksa ya da odalar uzak konumdaysa eklenen mobilya kamera görüş alanının dışında kalır; kullanıcı yeni eklediği mobilyayı göremez.  
**Düzeltme:** Spawn noktasını ilk odanın merkezine çek; oda yoksa `[0, 0]` kullan.

---

#### BUG-002 🟠 — AI önizleme varyant seçimi bounds kontrolsüz
**Dosya:** `src/store/designStore.ts`, `src/components/UI/AIPanel.tsx`  
**Sorun:** `applyAiPreview()` çağrılmadan önce `selectedIndex < variants.length` doğrulaması yapılmıyor. Claude'un bozuk JSON döndürmesi veya kullanıcının önizleme yüklenirken ikinci kez tıklaması durumunda `variants[selectedIndex]` undefined olabilir ve uygulama crash eder.  
**Düzeltme:**
```typescript
if (!variant || selectedIndex >= variants.length) return
```

---

#### BUG-003 🟠 — Oda spawn pozisyonu 6. odada sıfıra sarmalar
**Dosya:** `src/store/factories.ts` ~ satır 63  
**Sorun:**
```typescript
position: [(existingRoomCount * 1.2) % 6, 0],
```
6. oda `(6 × 1.2) % 6 = 1.2` → x≈1.2m, 7. oda `(7 × 1.2) % 6 = 2.4` şeklinde 1. odanın pozisyonuna yakın bir yerde başlar; odalar üst üste oluşur.  
**Düzeltme:** Modül yerine `Math.floor` ile grid yerleşimi kullan; ya da `existingRoomCount` koşulsuz artar şekilde bırak.

---

#### BUG-004 🟡 — updateRoom / updateFurniture pozisyon sınır kontrolü yok
**Dosya:** `src/store/designStore.ts` ~ satır 329-336  
**Sorun:** Klavye ile oda/mobilya taşıma sınırsız negatif/pozitif değer alabilir; `[-∞, ∞]` pozisyonlu öğe render hataları oluşturabilir.  
**Düzeltme:** `POSITION_LIMIT = 500` (metre) gibi bir sabit tanımlayıp `Math.max(-LIMIT, Math.min(LIMIT, ...))` ile kırp.

---

#### BUG-005 🟡 — importLayout tavan yüksekliğini yeniden doğrulamıyor
**Dosya:** `src/services/serialization.ts` ~ satır 94  
**Sorun:** `ceilingHeight` store'da [2.0, 4.0]m ile kısıtlanıyor ancak JSON import bu kontrolü atlıyor; bozuk dosya 10m tavan yüksekliğiyle yüklenebilir.  
**Düzeltme:** `serialization.ts` içinde `clamp(ceilingHeight, 2.0, 4.0)` uygula.

---

#### BUG-006 🟡 — Preset dosyalarında sabit ID çakışması
**Dosya:** `src/data/presets.ts` ~ satır 74-82  
**Sorun:** Preset mobilyaları `'p1-f1'`, `'p1-f2'` gibi sabit ID'ler kullanır. Kullanıcı arka arkaya iki preset yüklerse Zustand aynı ID'li iki mobilya öğesi oluşturur; biri diğerinin üzerine yazar.  
**Düzeltme:** `mkFurn()` factory içinde `nextFurnitureId()` kullan.

---

### 3.2 AI Servis Katmanı

#### BUG-007 🔴 — AI pozisyon koordinatları yanlış ölçekte (cm/m karışıklığı)
**Dosya:** `src/services/ai/client.ts` ~ satır 263-278  
**Sorun:**
```typescript
const worldPos: [number, number] = [
  room.position[0] + f.position[0],
  room.position[1] + f.position[1],
]
```
Claude'a gönderilen prompt "metre" der ancak bazen Claude cm cinsinden pozisyon döndürür. Hiçbir aralık doğrulaması yoktur; sonuçta mobilya 100 kat yanlış konuma yerleşir.  
**Düzeltme:** Dönen pozisyon değerini `Math.abs(x) > 50` ise 100'e böl; ya da Zod şemasına `z.number().min(-50).max(50).catch(0)` ekle.

---

#### BUG-008 🟠 — JSON çıkarma regex'i false positive verebilir
**Dosya:** `src/services/ai/client.ts` ~ satır 27-40  
**Sorun:**
```typescript
const start = jsonStr.search(/[{[]/)
```
Claude yanıtının başında açıklayıcı metin varsa ve açıklamada `{` geçiyorsa yanlış pozisyondan JSON parse edilmeye çalışılır; `SyntaxError` atılır.  
**Düzeltme:** Tüm candidate `{...}` bloklarını dene; ilk başarılı parse'ı kullan. Son çare olarak backtick bloğunu al.

---

#### BUG-009 🟠 — API key eksikken hata mesajı geç geliyor
**Dosya:** `src/services/ai/client.ts` ~ satır 21-24  
**Sorun:** `getClient()` çalıştırılmadan API key kontrolü yapılmıyor; hata kullanıcı "Öner" butonuna bastıktan sonra ortaya çıkıyor.  
**Düzeltme:** `AIPanel.tsx` içinde buton tıklanmadan önce `if (!aiApiKey)` ile erken uyarı ver (zaten kısmi UI var, sıfırdan tetikleniyor).

---

#### BUG-010 🟡 — Fotoğraf analizi sonucu aksiyon almaya izin vermiyor
**Dosya:** `src/components/UI/AIPanel.tsx` ~ satır 53-75  
**Sorun:** Fotoğraftan tanınan mobilya tipi/boyutu toast ile gösteriliyor ancak "Bu mobilyayı ekle" butonu yok. Kullanıcı manuel olarak katalogdan seçmek zorunda.  
**Düzeltme:** Analiz sonucuna `addFurniture()` çağıran "Sahneye Ekle" butonu ekle.

---

#### BUG-011 🟡 — Hızlı çift tıklamada çift API çağrısı
**Dosya:** `src/components/UI/AIPanel.tsx` ~ satır 43-51  
**Sorun:** "Öner" veya "Analiz Et" butonuna hızlı iki kez basılırsa `aiLoading` flag'ı ilk çağrı response'u almadan false kalır; iki paralel istek gönderilir.  
**Düzeltme:** Butona `disabled={aiLoading}` ekle ve `aiLoading` true anında butonları kilitle.

---

### 3.3 3D Bileşenler

#### BUG-012 🟠 — Döndürülmüş oda duvarlarında geometri çakışması
**Dosya:** `src/components/Room/RoomMesh.tsx` ~ satır 55-82  
**Sorun:** Köşe kesim (corner cutoff) hesaplaması odaların axis-aligned (rotation=0) olduğunu varsayar. Oda döndürüldüğünde (+90°, +180° vb.) köşe mesh'leri üst üste gelir; render sırasında z-fighting oluşur, görsel bozulma olur.  
**Düzeltme:** Köşe pozisyonlarını oda rotation'ına göre dönüştür ya da döndürülmüş odalarda köşe cutoff'u devre dışı bırak.

---

#### BUG-013 🟠 — Döndürülmüş mobilyada snap yönü hatalı
**Dosya:** `src/utils/snap.ts` ~ satır 124-196  
**Sorun:** `snapFurniturePosition()` `halfW` ve `halfD` değerlerini alır ama mobilya rotation'ını kullanmaz. 45° döndürülmüş kanepe için snapping hâlâ orijinal eksen yönlerine göre hesaplanır; snap hedefleri 20-30 cm kayık görünür.  
**Düzeltme:**
```typescript
const cosR = Math.cos(rotation), sinR = Math.sin(rotation)
const rotW = Math.abs(halfW * cosR) + Math.abs(halfD * sinR)
const rotD = Math.abs(halfW * sinR) + Math.abs(halfD * cosR)
// Bu değerleri halfW/halfD yerine kullan
```

---

#### BUG-014 🟡 — Context menüsü ekran kenarında kesilebiliyor
**Dosya:** `src/components/UI/ContextMenu.tsx` ~ satır 74-80  
**Sorun:** Menü pozisyonu `window.__lastPointerX/Y` değerinden hesaplanır, viewport sınırları kontrol edilmez. 1366×768 çözünürlükte sağ altta sağ tıklandığında menü ekranın dışına taşabilir.  
**Düzeltme:**
```typescript
const x = Math.min(clientX, window.innerWidth  - menuW - 8)
const y = Math.min(clientY, window.innerHeight - menuH - 8)
```

---

#### BUG-015 🟡 — Auto-pin döndürülmüş oda için yanlış oda seçebilir
**Dosya:** `src/hooks/useAutoPin.ts` ~ satır 9-16  
**Sorun:** `snapFurniturePosition()` mobilyanın hangi odayla snap edildiğini rotation'sız hesaplar, `useAutoPin` ise o snap odayı referans alır. Sonuçta mobilya görsel olarak A odasının içindeyken B odasına pinlenir.  
**Düzeltme:** Auto-pin'de oda belirleme için snap sonucunu değil, mobilyanın yerel koordinat dönüşümünü (rotation hesaba katarak) kullan.

---

### 3.4 Serileştirme / Veri Bütünlüğü

#### BUG-016 🟡 — Duvar açıklıkları import'ta doğrulanmıyor
**Dosya:** `src/services/serialization.ts` ~ satır 51  
**Sorun:**
```typescript
openings: Array.isArray(r.openings) ? r.openings : []
```
Açıklık nesnelerinin içi (`positionAlongWall`, `widthCm`, `heightCm`) hiç kontrol edilmiyor. `positionAlongWall: 2.5` (duvar uzunluğunun 250%'si) gibi bozuk veri sessizce yüklenir, duvar geometrisi çöker.  
**Düzeltme:** `positionAlongWall`'u `[0.05, 0.95]` ile kırp; `widthCm` ve `heightCm`'i oda boyutlarıyla kıyasla.

---

#### BUG-017 🟡 — Kayıt dosyasında versiyon geçiş (migration) mekanizması yok
**Dosya:** `src/services/serialization.ts` ~ satır 4-8  
**Sorun:** `CURRENT_VERSION = 1` sabit olarak tanımlı ancak import edilen JSON'da `version` alanı okunmuyor. İleride veri modeli kırıcı değişiklikle v2'ye geçerse eski `.json` dosyaları yüklenemez ve hata mesajı belirsiz olur.  
**Düzeltme:**
```typescript
const version = raw.version ?? 1
if (version < CURRENT_VERSION) migrateV1toV2(raw)
```

---

#### BUG-018 🟢 — Mobilya dims sınırları katalog değerine göre değil global sabitlerle kırpılıyor
**Dosya:** `src/services/serialization.ts` ~ satır 58-62  
**Sorun:** Tüm dims `[10, 5000]` cm ile kırpılıyor. FURNITURE_CATALOG'da her tip için gerçekçi min/max değerleri var; bozuk bir JSON'da kanepe 50 metre uzunluğunda yüklenebilir.  
**Düzeltme:** `getBoundingBox(f.type)` ile katalog boyutlarını alıp o aralıkta kırp.

---

## 4. Yapılacaklar — Özellik Boşlukları

### 4.1 Öncelikli Özellikler

#### FEAT-001 🟠 — Açıklık (kapı/pencere) düzenleme arayüzü eksik
PropertiesPanel'de açıklık seçilebiliyor ama genişlik / yükseklik / alt kenar yüksekliği için input yok. Kullanıcı 3D sahnede açıklık seçip ardından düzenleyemediği için bu özellik yarım kalmış.  
**Çözüm:** PropertiesPanel'e seçili açıklık için `widthCm`, `heightCm`, `bottomCm` NumberField bileşenleri ekle.

---

#### FEAT-002 🟠 — Mobilya çakışma göstergesi (collision feedback) yok
Mobilyalar birbirine ve duvara geçebiliyor; gerçek dışı plan oluşturulabiliyor. Üst üste binen öğeler için kırmızı outline / toast uyarısı yok.  
**Çözüm:** Her mobilya update sonrası `checkOverlap()` çalıştır; çakışan öğeye kırmızı outline shader ekle ya da toast ile uyar.

---

#### FEAT-003 🟡 — Fotoğraf analizi sonucu sahneye eklenemiyor
AI fotoğraftan mobilya tipi/boyutu tanıyor ama "Sahneye Ekle" butonu yok. Kullanıcı sonucu not alıp manuel eklemek zorunda.  
→ BUG-010 ile aynı köken. Özellik ve bug olarak ikisi birlikte kapatılabilir.

---

#### FEAT-004 🟡 — Aydınlatma analizi aksiyon önerisi vermiyor
Lüks tahmini hesaplanıyor (`src/utils/light.ts`) ama `RECOMMENDED_LUX` eşiklerini karşılamayan odalara uyarı/öneri yok.  
**Çözüm:** PropertiesPanel'de oda seçiliyken "Bu oda için önerilen lüks: 300 lx, mevcut: 85 lx — 2 lamba daha ekleyin" gibi öneri göster.

---

#### FEAT-005 🟡 — Kroki analizinden açıklık/mobilya çıkarılmıyor
Blueprint upload AI'a gönderiliyor ve odalar oluşturuluyor; ancak kapı/pencere konumları ve mevcut mobilya yerleşimi parse edilmiyor.  
**Çözüm:** `SYSTEM_BLUEPRINT` prompt'una açıklık ve mobilya listesi alanları ekle; schema'ya `openings?: Opening[]` ekle.

---

#### FEAT-006 🟡 — Oda silme onay diyalogu yok
Oda silindiğinde tüm pinli mobilyalar da kalkıyor; tek tıkla kalıcı silme. Undo var ama fark edilmeyebilir.  
**Çözüm:** "Bu odayı ve içindeki X mobilyayı silmek istediğinize emin misiniz?" ConfirmModal ya da Toast action butonu.

---

#### FEAT-007 🟢 — Mobilya arama sonuçları highlight edilmiyor
Arama yapıldığında eşleşen kategoriler açılıyor ama eşleşen item'larda vurgu rengi yok; hangisinin neden eşleştiği belli değil.  
**Çözüm:** Eşleşen metni `<mark>` ile sarıp Tailwind `bg-amber-200` ekle.

---

#### FEAT-008 🟢 — Açıklık tipi "french-balcony" AI'a öğretilmemiyor
`OpeningType` union'da `'french-balcony'` mevcut, 3D render var; ama sistem promptlarında bu tip hiç geçmiyor. AI hiçbir zaman fransız balkon önermez.  
**Çözüm:** `prompts.ts` `SYSTEM_PLAN` içine `'french-balcony'` örnek use-case ekle.

---

### 4.2 Gelecek Sürüm Özellikleri

| ID | Özellik | Öncelik |
|---|---|---|
| FEAT-009 | Çoklu oda seçimi ve toplu taşıma | 🟡 Orta |
| FEAT-010 | Zemin/duvar doku yükleme (kullanıcı görseli) | 🟡 Orta |
| FEAT-011 | Plan PDF / PNG export | 🟡 Orta |
| FEAT-012 | Oda etiketleri (isim yazısı 3D sahne üzerinde) | 🟢 Düşük |
| FEAT-013 | Mobilya favorileri / özel liste | 🟢 Düşük |
| FEAT-014 | Birden fazla kat (katlar arası bağlantı) | 🟢 Gelecek |
| FEAT-015 | Çok kullanıcılı gerçek zamanlı co-edit | 🟢 Gelecek |

---

## 5. Teknik Borç Kalanı

Faz 5 sonrası **sıfır kalan borç** ancak aşağıdaki yapısal konular gözetilmeli:

### 5.1 Koordinat Sistemi Tutarsızlığı (belgelenmeli)

```
Oda boyutları     →  cm   (widthCm, lengthCm)
Oda pozisyonu     →  m    ([x, z])
Mobilya boyutları →  cm   (dims.w, dims.d, dims.h)
Mobilya pozisyon  →  m    ([x, z])
Snap eşikleri     →  m    (0.08, 0.18)
AI prompt birim   →  m    (açık belirtilmiş)
```

Risk: `cm` değeri yanlışlıkla metre birimli fonksiyona geçilirse 100× hata oluşur (BUG-007'nin kökeni).  
**Öneri:** `src/utils/units.ts` dosyası oluştur, `cmToM()` / `mToCm()` yardımcıları ekle; birimsiz sayı transferi yapan her yere yorum sat.

---

### 5.2 Model Kaydı Dinamik Değil

`src/components/Furniture/models/` altındaki her model bileşeni `modelComponents` map'ine elle ekleniyor. Yeni model eklemek iki dosyada değişiklik gerektirir.  
**Öneri:** `import.meta.glob` ile otomatik kayıt:
```typescript
const modules = import.meta.glob('./models/**/*.tsx', { eager: true })
```

---

### 5.3 AI Model Sürümü Hardcoded

```typescript
model: 'claude-sonnet-4-6'   // src/services/ai/client.ts:16
```
Anthropic model adı değişirse uygulama bozulur.  
**Öneri:** `VITE_CLAUDE_MODEL` env değişkeni; `.env.example`'a ekle.

---

### 5.4 AI Prompt'ları Test Edilemiyor

`prompts.ts` string'ler; versiyon kontrolü yok, A/B testi yok.  
**Öneri:** Prompt'ları `src/data/prompts/` altında `.txt` ya da `.md` olarak tut; CI'da lint et.

---

## 6. Performans Notları

### Mevcut Bundle Dağılımı (gzip)

| Chunk | Gzip |
|---|---|
| `three.module` | 182 KB |
| `index` (core) | 257 KB |
| `client` (drei) | 42 KB |
| `designStore` | 7 KB |
| Tüm lazy modaller | ~17 KB toplam |
| **Toplam** | **~505 KB** |

### Performans Riskleri

| Senaryo | Etki | Risk |
|---|---|---|
| 50+ mobilya sürükleme | Snap O(n²) döngüsü | 🟡 Orta |
| 100+ PropertiesPanel listesi | Tüm satırlar yeniden render | 🟡 Orta |
| Büyük oda (50×50m) + dar snap eşiği | Snap çalışmıyor gibi görünür | 🟢 Düşük |
| 500+ undo geçmişi | Zundo bellek baskısı | 🟢 Düşük |

**Kısa vadeli öneri:** `PropertiesPanel` satırlarına `React.memo` ekle; snap hesabına `useRef` tabanlı önbellek koy.

---

## 7. Test Kapsamı Analizi

### Mevcut Durum (133 test, 8 dosya)

| Dosya | Test Sayısı | Kapsam |
|---|---|---|
| `snap.test.ts` | 34 | Snap edge case'leri kapsamlı |
| `factories.test.ts` | 27 | createRoom, createFurniture, opening factory |
| `transforms.test.ts` | 15 | Rotasyon / öteleme matematiği |
| `aiPreview.test.ts` | 12 | replace/merge/style modları |
| `light.test.ts` | 18 | Kelvin→hex, lüks tahmini |
| `compass.test.ts` | 8 | Pusula yön hesabı |
| `wallSegments.test.ts` | 7 | Duvar segment bölme |
| `serialization.test.ts` | 12 | Import/export doğrulama |

### Kritik Test Boşlukları

| Alan | Test Sayısı | Öncelik |
|---|---|---|
| `src/services/ai/client.ts` | **0** | 🔴 Kritik |
| `src/components/UI/*` (tüm UI) | **0** | 🟠 Yüksek |
| Store aksiyonları (updateRoom, pin…) | **0** | 🟠 Yüksek |
| `src/utils/snap.ts` — rotation senaryoları | **0** | 🟡 Orta |
| Serialization migration | **0** | 🟡 Orta |

**Önerilen ekleme sırası:**
1. AI client unit testleri (mock ile `callText`, JSON extract, schema fallback)
2. Store aksiyonları (updateRoom bounds, duplicateFurniture, importLayout)
3. Snap rotation senaryoları

---

## 8. Mimari Kararlar & Notlar

### Undo/Redo (Zundo)
- 300ms debounce ile bitişik değişiklikler tek history entry'ye yazılır
- 50 adım limiti `designStore.ts:454`'te değiştirilebilir
- `temporal.getState().undo()` doğrudan çağrı; store'un dışından erişilebilir

### Lazy Loading Stratejisi
6 modal bileşen `React.lazy()` + koşullu mount:
```tsx
{showHelp && <HelpPanel ... />}
```
Bileşen kapatıldığında unmount → DOM'dan kalkar, belleği serbest bırakır.

### Window Listener Yönetimi
Sürükleme için `window`-level pointer listener'ları kullanılıyor (canvas sınırı dışına çıkıldığında da çalışır). `window.__evPointerCaptured` mutex ile race condition önleniyor. Unmount cleanup `useEffect(() => () => stopDrag(), [])` ile sağlanıyor.

### AI Akış Mimarisi
```
User input
  → AIPanel (UI layer)
  → designStore.runAI() (orchestration)
  → services/ai/client.ts (Claude API call)
  → Zod schema validation
  → designStore.setAiPreview() (preview state)
  → AIPanel preview selector
  → designStore.applyAiPreview() (apply to scene)
```

---

## 9. Sürüm Yol Haritası Önerisi

### v0.2.0 — "Kararlı Temel"
**Odak:** Kritik bug fix + eksik temel özellik

- [ ] BUG-001: Mobilya spawn pozisyonu
- [ ] BUG-002: AI varyant bounds kontrolü
- [ ] BUG-007: AI koordinat ölçeği doğrulama
- [ ] BUG-012: Döndürülmüş oda duvar geometrisi
- [ ] BUG-013: Döndürülmüş mobilya snap
- [ ] FEAT-001: Açıklık düzenleme arayüzü
- [ ] FEAT-002: Mobilya çakışma göstergesi
- [ ] BUG-014: Context menü viewport kırpma
- [ ] AI client testleri (BUG-009, BUG-011 birlikte)

---

### v0.3.0 — "AI Tamamlama"
**Odak:** AI özelliklerini kapatma

- [ ] FEAT-003: Fotoğraf → sahneye ekle butonu
- [ ] FEAT-005: Kroki → açıklık + mobilya çıkarma
- [ ] FEAT-004: Aydınlatma analiz önerisi
- [ ] BUG-008: JSON çıkarma robustness
- [ ] BUG-017: Versiyon migration mekanizması
- [ ] FEAT-008: `'french-balcony'` prompt'a ekleme

---

### v0.4.0 — "Polishing"
**Odak:** UX cilası + performans

- [ ] FEAT-006: Oda silme onay diyalogu
- [ ] FEAT-007: Arama highlight
- [ ] FEAT-009: Çoklu oda seçimi
- [ ] FEAT-011: Plan PDF/PNG export
- [ ] Snap O(n²) optimizasyonu
- [ ] `React.memo` PropertiesPanel satırları
- [ ] AI model env değişkeni (5.3 borç)

---

### v1.0.0 — "Release"
**Odak:** Production hazırlık

- [ ] E2E testleri (Playwright)
- [ ] Error tracking entegrasyonu (Sentry vb.)
- [ ] CI/CD pipeline (build + test + deploy)
- [ ] SEO & meta tags
- [ ] PWA manifest
- [ ] Accessibility audit (WCAG 2.1 AA)

---

*Rapor oluşturulma: 2026-04-15 | Commit: 69336e1 | Hazırlayan: Claude Code (Anthropic)*
