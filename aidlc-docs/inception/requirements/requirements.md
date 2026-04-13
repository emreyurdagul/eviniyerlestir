# EviniYerlestir - Gereksinim Dokumani

## Intent Analysis

- **User Request**: 3D ev tasarim uygulamasi - kat plani olusturma, mobilya yerlestirme, boyut ayarlama, kaydetme/yukleme. Mevcut prototip yeniden yapilandirilacak.
- **Request Type**: New Project (prototipten tam uygulama donusumu)
- **Scope Estimate**: System-wide (3D engine, state management, UI, serialization, i18n)
- **Complexity Estimate**: Complex (3D rendering, coklu gorunum modlari, mobil destek, genisletilebilir mimari)
- **Target Audience**: Genel amacli - bireysel kullanicilar, ic mimarlar, emlak sektoru

---

## Functional Requirements

### FR-01: Kat Plani Olusturma
**Oncelik**: Yuksek (Faz 1)
- **FR-01.1**: Hazir oda sablonlari ile hizli kat plani olusturma (salon, yatak odasi, mutfak, banyo, koridor, cocuk odasi)
- **FR-01.2**: Sablonlarda boyut (en x boy) cm cinsinden ayarlanabilmeli (min 20cm, max 5000cm)
- **FR-01.2.1**: Boyutlandirma hem input alanlari hem fare/parmak surekleme (handle-based resize) ile yapilabilmeli
- **FR-01.3**: Odalar suruklenerek konumlandirilabilmeli
- **FR-01.4**: Odalar 90 derece adimlarla dondurulabilmeli
- **FR-01.5** (Faz 2): Serbest cizim modu - duvarlari noktadan noktaya cizerek oda olusturma
- **FR-01.6** (Faz 3): Blueprint/kroki goruntusu import ederek kat plani olusturma

### FR-02: Mobilya Yerlestirme
**Oncelik**: Yuksek (Faz 1)
- **FR-02.1**: 12+ mobilya tipi katalogundan secim:
  - Mevcut: Koltuk (3'lu), Tekli Koltuk, Yemek Sandalyesi, Orta Sehpa, TV Unitesi, Yemek Masasi, Yatak
  - Yeni: Dolap, Raf/Kitaplik, Lambader, Hali, Bitki/Saksi
- **FR-02.2**: Mobilyalar sahneye surukle-birak ile yerlestirilmeli
- **FR-02.3**: Mobilya boyutlari fare/parmak handle surekleme ile ayarlanabilmeli (birincil), sayisal input opsiyonel
- **FR-02.4**: Mobilyalar 90 derece adimlarla dondurulabilmeli
- **FR-02.5**: Mobilya secildiginde gorsel vurgu (highlight) gosterilmeli

### FR-03: Mobilya Modelleri
**Oncelik**: Orta (Faz 1 basit, Faz 2-3 gelismis)
- **FR-03.1** (Faz 1): Detayli prosedural modeller (yuvarlatilmis kenarlar, doku eklenebilir)
- **FR-03.2** (Faz 2): GLTF/GLB 3D model dosyasi yukleme destegi
- **FR-03.3** (Faz 3): Fotograf yukleme ile yaklasik 3D model olusturma (AI destekli)

### FR-04: Gorunum Modlari
**Oncelik**: Yuksek (Faz 1)
- **FR-04.1**: 3D perspektif gorunum (orbit kamera, zoom, pan)
- **FR-04.2**: Ust gorunum (top-view, ortografik)
- **FR-04.3** (Faz 2): Ayri 2D mimari cizim gorunumu (olculu, yazili, mimari standartlarda)

### FR-05: Olcu Gosterimi
**Oncelik**: Orta (Faz 1 panel, Faz 2 3D)
- **FR-05.1** (Faz 1): Properties panelinde sayisal degerler
- **FR-05.2** (Faz 2): 3D sahnede duvar uzerinde olcu cizgileri ve annotasyonlar

### FR-06: Kaydetme ve Paylasim
**Oncelik**: Yuksek (Faz 1 temel, Faz 2 gelismis)
- **FR-06.1** (Faz 1): localStorage ile otomatik kayit (her degisiklikte)
- **FR-06.2** (Faz 1): JSON dosya export/import
- **FR-06.3** (Faz 2): Link ile paylasim (URL encoded veya kisa link)
- **FR-06.4** (Faz 2): PNG gorsel export
- **FR-06.5** (Faz 2): PDF cikti (olculu kat plani)

### FR-07: Duvar ve Oda Ozellikleri
**Oncelik**: Orta (Faz 2)
- **FR-07.1** (Faz 2): Duvar rengi degistirme
- **FR-07.2** (Faz 2): Kapi ekleme (duvar uzerine)
- **FR-07.3** (Faz 2): Pencere ekleme (duvar uzerine)
- **FR-07.4** (Faz 2): Zemin malzemesi secimi (parke, fayans, hali, laminat)

### FR-08: Kullanici Arayuzu
**Oncelik**: Yuksek (Faz 1)
- **FR-08.1**: Sol panel - oda tipleri + mobilya katalogu (tab'li)
- **FR-08.2**: Sag panel - secili nesne ozellikleri (boyut, konum, rotasyon)
- **FR-08.3**: Alt bar - araclar (dondur, gorunum degistir, kaydet, yukle)
- **FR-08.4**: Secim gostergesi (badge) - secili nesne bilgisi
- **FR-08.5**: Paneller acilip kapatilabilmeli

### FR-09: Coklu Dil Destegi
**Oncelik**: Dusuk (Faz 1 altyapi, Faz 2+ diller)
- **FR-09.1** (Faz 1): i18n altyapisi hazir olacak (tum metinler cevirilere alinabilir)
- **FR-09.2** (Faz 1): Turkce varsayilan dil
- **FR-09.3** (Faz 2+): Ingilizce dil destegi eklenecek

---

## Non-Functional Requirements

### NFR-01: Performans
- 3D sahne 60fps hedefle masaustunde render edilmeli
- Mobil cihazlarda minimum 30fps
- 20+ mobilya + 5+ oda iceren sahnelerde performans kabul edilebilir olmali
- Sayfa ilk yuklenmesi < 3 saniye (LCP)

### NFR-02: Responsive ve Mobil
- Masaustu (1280px+), tablet (768px+), mobil (375px+) destegi
- Touch gestleri: pinch-zoom, iki parmak dondurme, tek parmak surekleme
- Mobilde paneller tam ekran overlay olarak acilmali

### NFR-03: Erisebilirlik (Temel)
- Klavye navigasyonu (tab, enter, escape)
- Yeterli renk kontrasti (WCAG AA)
- Ekran okuyucu icin temel ARIA etiketleri

### NFR-04: Tarayici Destegi
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- WebGL 2.0 desteyi zorunlu

### NFR-05: Guvenlik
- XSS koruması (kullanici girdileri sanitize)
- JSON import dosyalari validate edilmeli (schema kontrolu)
- localStorage verisi sifrelenmez ama yapisi dogrulanir
- Ucuncu parti bagimliliklarda bilinen guvenlik aciklari olmamali

### NFR-06: Genisletilebilirlik
- Yeni mobilya tipleri kolayca eklenebilmeli (registry pattern)
- Yeni oda tipleri kolayca eklenebilmeli
- Plugin/modul sistemi icin mimari hazir olmali

---

## Technical Decisions

| Karar | Secim | Gerekce |
|-------|-------|---------|
| Framework | React 18 + TypeScript | Tip guvenligi, ekosistem |
| 3D Engine | @react-three/fiber + drei | Deklaratif, React state entegrasyonu |
| State | Zustand (+ immer middleware) | Hafif, undo/redo desteyi |
| Build | Vite | Hizli HMR |
| Styling | Tailwind CSS | Utility-first, responsive |
| i18n | react-i18next (altyapi) | Endüstri standardi |
| Deploy | VPS (Nginx static) | Kullanicinin mevcut altyapisi |
| Backend | Yok (client-side) | Basitlik, sifir maliyet |

---

## Faz Plani Ozeti

| Faz | Kapsam | Ozellikler |
|-----|--------|------------|
| **Faz 1 (MVP)** | Temel uygulama | Sablon odalar, 12+ mobilya, 3D/top gorunum, localStorage + JSON, i18n altyapisi, touch destegi |
| **Faz 2** | Detayli tasarim | Serbest cizim, duvar rengi/kapi/pencere, 2D mimari gorunum, olcu annotasyonlari, GLTF yukle, PNG/PDF/link export, undo/redo, EN dili |
| **Faz 3** | Akilli ozellikler | Foto-to-3D model, blueprint import, mobilya onerileri |

---

## Extension Configuration

| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes | Requirements Analysis |
| Property-Based Testing | Partial (pure functions + serialization) | Requirements Analysis |
