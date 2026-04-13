# EviniYerlestir - NFR Requirements (Konsolide)

## NFR-01: Performans

### Render Performansi
| Metrik | Masaustu | Mobil |
|--------|----------|-------|
| Hedef FPS | 60 | 30 |
| Minimum FPS | 45 | 20 |
| Maksimum sahne | 50+ nesne (oda + mobilya) | 30+ nesne |

### Optimizasyon Stratejisi: Frustum Culling + LOD + Instanced Rendering
- **Frustum culling**: Kamera gorunumunde olmayan nesneler render atlanir (R3F varsayilan)
- **LOD (Level of Detail)**: Uzaktaki nesneler dusuk polygon modelle render edilir
- **Instanced rendering**: Ayni geometrideki mobilyalar (ornegin 6 sandalye) tek draw call
- **React.memo**: Degismeyen 3D component'ler gereksiz re-render'dan korunur
- **Lazy geometry**: Mobilya modeli sadece sahneye eklendiginde olusturulur

### Sayfa Yuklenme
| Metrik | Hedef |
|--------|-------|
| LCP (Largest Contentful Paint) | < 3 saniye |
| FID (First Input Delay) | < 100ms |
| Bundle boyutu (gzip) | < 500KB |

### Onlemler
- Vite code splitting (lazy import)
- Three.js tree-shaking
- Mobilya modelleri dynamic import

## NFR-02: Responsive ve Mobil

### Breakpoint'ler
| Cihaz | Genislik | Davranis |
|-------|----------|----------|
| Masaustu | 1280px+ | Sol + sag panel yan yana |
| Tablet | 768-1279px | Paneller daraltilmis/overlay |
| Mobil | 375-767px | Paneller tam ekran overlay, alt bar sabit |

### Touch Gestleri
- Tek parmak surekleme: nesne tasi
- Iki parmak dondurme: kamera orbit
- Pinch zoom: kamera yakinlastirma
- Handle surekleme: boyutlandirma (tek parmak)

### Touch Hedefleri
- Minimum buton boyutu: 44x44px
- Handle boyutu: mobilde 2x buyutulmus (kolay dokunma)

## NFR-03: Guvenlik (Security Baseline)

### SECURITY-01: Veri Koruma
- **N/A** (Encryption at rest/transit): Saf client-side, sunucu yok, dis veri transferi yok
- localStorage sifrelenmez (tarayici guvenlik modeline guvenilir)

### SECURITY-02: Access Logging
- **N/A**: Network intermediary yok (statik site)

### SECURITY-03: Input Validation
- **UYGULANIR**: JSON import dosyalari mutlaka schema validate edilmeli
- Whitelist yaklasimi: sadece bilinen alanlar kabul edilir
- Boyut degerleri sinir kontrolu (20-5000cm)
- Tip kontrolu (string, number, enum)
- Bilinmeyen alanlar sessizce atilir

### SECURITY-04: XSS Korumasi
- **UYGULANIR**: Kullanici girdileri (oda isimleri vb.) sanitize edilmeli
- React varsayilan XSS korumasina guvenilir (JSX auto-escape)
- dangerouslySetInnerHTML kullanilmaz

### SECURITY-05: Dependency Guvenliqi
- `npm audit` CI/CD pipeline'da calistirilir
- Bilinen zaafiyetli paketler kullanilmaz
- Dependabot / renovate ile guncelleme takibi

### Security Baseline Uyum Ozeti
| Kural | Durum | Aciklama |
|-------|-------|----------|
| SECURITY-01 | N/A | Sunucu/DB yok |
| SECURITY-02 | N/A | Network intermediary yok |
| SECURITY-03 (Input) | UYGULANIR | JSON schema validation |
| SECURITY-04 (XSS) | UYGULANIR | React auto-escape + no dangerouslySetInnerHTML |
| SECURITY-05 (Deps) | UYGULANIR | npm audit |

## NFR-04: Tarayici Destegi

| Tarayici | Minimum Versiyon |
|----------|-----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |
| WebGL | 2.0 zorunlu |

### WebGL Fallback
- WebGL destegi yoksa kullaniciya uyari mesaji goster
- 3D sahne yerine statik mesaj: "Bu tarayici 3D goruntulemeyi desteklemiyor"

## NFR-05: Erisebilirlik (Temel)

- Klavye navigasyonu: Tab ile panel gecisi, Enter ile aksiyon
- ARIA etiketleri: butonlar, paneller, input'lar icin
- Renk kontrasti: WCAG AA (4.5:1 metin, 3:1 buyuk metin)
- Focus gostergesi: klavye kullanicilar icin gorunur focus ring

## NFR-06: Genisletilebilirlik

- **FurnitureRegistry**: Yeni mobilya tipi eklemek icin tek fonksiyon cagirisi yeterli
- **RoomTypes**: Yeni oda tipi eklemek icin config dizisine ekleme yeterli
- **i18n**: Yeni dil eklemek icin locales/ altina JSON dosyasi yeterli
- **Plugin hazirlik**: Faz 3 icin modul yapisi korunur

## NFR-07: Property-Based Testing (Partial)

### PBT Uygulama Alanlari
| Alan | Test Tipi | Aciklama |
|------|-----------|----------|
| Serialization round-trip | PBT | exportLayout → importLayout → exportLayout ayni sonuc |
| Boyut sinir kontrolu | PBT | Rastgele boyut degerleri min/max sinirlarinda dogrulama |
| JSON schema validation | PBT | Rastgele gecersiz JSON → hata firlatmali |
| Pozisyon transform | PBT | Surekleme sonrasi pozisyon tutarliligi |

### PBT Kutuphanesi
- `fast-check` (TypeScript uyumlu, en yaygin PBT kutuphanesi)

### PBT Disinda Kalan Alanlar
- 3D rendering (gorsel test, PBT uygun degil)
- UI etkilesim (integration test ile kaplanir)
- Kamera navigasyonu
