# Cycle 2 - Requirements

## Intent Analysis
- **Request**: Mobilya odaya sabitleme + AI ozellikleri (paralel gelistirme)
- **Type**: Major feature additions (3 yeni FR grubu)
- **Scope**: System-wide (state, 3D, UI, AI integration)
- **Complexity**: Complex (AI servisi entegrasyonu + spatial reasoning)

---

## Functional Requirements

### FR-A: Mobilya - Oda Hibrit Sabitleme

**FR-A.1** Otomatik sabitleme onerisi
- Mobilya bir odanin sinirlari icinde durduktan ~500ms sonra "Bu mobilyayi {Salon}'a sabitle?" toast bildirimi cikar
- Toast'ta "Sabitle" ve "Hayir" butonlari
- Kullanici onaylarsa `parentRoomId` set edilir

**FR-A.2** Manuel sabitleme
- Properties panelinde mobilya secildiginde "Odaya Sabitle" buton grubu
- Mobilyanin uzerinde durdugu odalar listelenir, kullanici secebilir
- Mevcut `pinToRoom` action zaten var, UI eklenmemis

**FR-A.3** Hibrit fiziksel bag (varsayilan)
- Mobilya bir odaya sabitlendiyse, oda tasininca/dondurulurken mobilya da ayni offset ile hareket eder
- Oda boyutu degisirken mobilya pozisyonu KORUNUR (taşınmaz)
- Properties panelinde "Kopar" butonu - bag mantiksal kalir ama fiziksel hareket durur

**FR-A.4** Oda disina cikma
- Mobilya bir odaya sabitliyken oda disina suruklunirse:
  - Sinir engellenmez (serbest cikis)
  - `parentRoomId` otomatik `null` olur
  - Selection badge'de "Bagimsiz" gosterilir

**FR-A.5** Sabitleme gorsel gostergesi
- Sabitlenmis mobilya secildiginde 3D'de oda+mobilya iliskisi cizgi/highlight ile gosterilir
- Properties panel listesinde mobilyanin yaninda kucuk oda renk noktasi

---

### FR-B: AI Ozellikleri (6 ozellik, manuel tetikleme)

**FR-B.1** Akilli mobilya yerlestirme
- Secili oda icin "AI Yerlesim Onerisi" butonu
- AI: oda boyutu + tipini analiz eder, mevcut mobilyalar icin pozisyon onerir
- Yeni mobilya da onerebilir (eksikse)

**FR-B.2** Mobilya onerisi
- Secili oda icin "Eksik Mobilya Oner" butonu
- AI: oda tipine gore (yatak odasi → yatak/gardrop, salon → koltuk/sehpa) eksikleri listeler

**FR-B.3** Doga sorgulu plan olusturma
- Alt bardan "AI Plan Olustur" butonu → metin girisi modali
- Ornek: "100 m2 daire, 3 oda 1 salon"
- AI: oda listesi + boyutlari + yerlesim donerek otomatik kat plani olusturur

**FR-B.4** Foto-to-3D model
- Mobilya Yukleme menusunde "Fotograf ile Olustur" secenegi
- Kullanici bir mobilya fotografi yukler, AI yaklasik bbox + tip tahmini yapar
- Sonuc: `addCustomFurniture` benzeri akış (placeholder kutu olustur, kullanici detaylandirir)
- **NOT**: Tam 3D model olusturma (image-to-3D) cok agir, simdilik tip tahmini + bounding box yeterli

**FR-B.5** Stil danismani
- Secili oda icin "Stil Onerileri" butonu
- AI: mevcut mobilya/renkleri analiz eder, uyumlu duvar rengi + zemin + dekor mobilya onerileri

**FR-B.6** Kroki → Tam Plan
- Yuklenmis blueprint (PDF/goruntu) varken "Krokiden Plan Olustur" butonu
- AI: gorsel cikariminda oda + duvar tahmini yapar (yaklasik)
- **NOT**: Vision API (Claude Sonnet vision) gerektirir

### AI Sonuc Sunum Akisi (FR-B.7)
1. Kullanici AI butonuna tiklar
2. Modal: "AI birden fazla seçenek sunsun mu? (1-4 arasi)"
3. AI istenildigi kadar oneri uretir
4. Her oneri yari saydam onizleme olarak gosterilir, kullanici tablar arasında gecer
5. "Uygula" -> sahneye yansir, "Iptal" -> kapanir

### AI Servis (FR-B.8)
- **Simdilik**: Kullanici Settings menusunden Anthropic API key girer (browser localStorage)
- **Gelecek**: Kendi backend proxy (API key gizli)
- Tum AI cagrilari `services/ai.ts` katmaninda merkezi (backend gecisi kolay olsun)

---

## Non-Functional Requirements

### NFR-A: Performans
- Auto-pin detection 500ms debounce (her tikta tetiklenmesin)
- AI response timeout: 30sn
- AI sonuclari LRU cache (ayni input → ayni cevap, tekrar API call yok)

### NFR-B: Guvenlik
- API key sadece localStorage'da, hicbir bilesen gondermez (sadece direct fetch'e gider)
- API key girisi password input
- AI cevabi her zaman validate (JSON schema), kotu cevapta hata mesaji
- Kullanici girdileri (text query) sanitize → XSS yok

### NFR-C: UX
- AI calistigi sirada loading spinner + "AI dusunuyor..."
- AI cevabi gelene kadar UI bloke olmaz
- AI hatasinda anlasilir mesaj (rate limit, quota, network)

### NFR-D: Genisletilebilirlik
- AI servis katmani backend gecisi icin abstrakt: `aiClient.suggestPlacement(roomId)` cagrisi backend yorunge degistirilebilir
- Yeni AI ozelligi eklemek tek dosya degistirir (`services/ai.ts` + UI buton)

---

## Out of Scope (Bu Cycle Disinda)
- Backend implementasyonu (gelecek cycle)
- Real-time collaboration
- Multi-floor support
- VR/AR

---

## Acceptance Criteria Ozeti

| FR | Test Senaryosu |
|----|---------------|
| A1 | Mobilya odaya sürükle → toast cikar → "Sabitle" → parentRoomId set |
| A2 | Properties panel → "Odaya Sabitle" tikla → oda listesi → sec → set |
| A3 | Sabitli mobilya, oda 1m sag tasini → mobilya da 1m sag |
| A3 | Sabitli mobilya, oda boyutu degisti → mobilya pozisyonu DEGISMEDI |
| A4 | Sabitli mobilya oda disina suruklunir → parentRoomId null oldu |
| B1 | Salon sec → "AI Yerlesim" → modal "kac oneri?" → 3 oneri uretildi → onizleme → uygula |
| B3 | "AI Plan" → "100m2 3+1" → oda listesi olustu → sahneye eklendi |
| B5 | Salon sec (mobilyali) → "Stil" → renk onerisi geldi → uygula |
| B8 | API key girilmemis → AI butonu tiklayinca settings modal acilir |

---

## Decisions Snapshot

| Karar | Deger |
|-------|-------|
| Sabitleme bagi | Hibrit (varsayilan fiziksel + kopar) |
| Sabitleme tetigi | Otomatik oneri + manuel UI |
| Sinir | Serbest (cikinca otomatik kopar) |
| AI servis | Anthropic API key (client) → backend (gelecek) |
| AI sonuc | Onceden "kac oneri" sor + onizleme + onay |
| AI tetigi | Sadece manuel buton (otomatik bildirim yok) |
| Cycle siralama | Paralel (sabitleme + AI ayni cycle) |
