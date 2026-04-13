# EviniYerlestir - Hikaye-Unite Eslestirmesi

## Eslestirme Tablosu

| Hikaye | Aciklama | Unite |
|--------|----------|-------|
| US-1.1 | Sablondan Oda Ekleme | U3 Room + U5 UI (Toolbar) |
| US-1.2 | Oda Boyutlandirma (handle + input) | U3 Room + U5 UI (Props) |
| US-1.3 | Oda Konumlandirma (surekleme) | U3 Room |
| US-1.4 | Oda Dondurme | U3 Room + U5 UI (BottomBar) |
| US-1.5 | Oda Silme | U3 Room + U5 UI (Props) |
| US-2.1 | Mobilya Ekleme | U4 Furniture + U5 UI (Toolbar) |
| US-2.2 | Mobilya Surekleme | U4 Furniture |
| US-2.3 | Mobilya Boyutlandirma (handle + input) | U4 Furniture + U5 UI (Props) |
| US-2.4 | Mobilya Dondurme | U4 Furniture + U5 UI (BottomBar) |
| US-2.5 | Mobilya Silme | U4 Furniture + U5 UI (Props) |
| US-3.1 | 3D Perspektif Gorunum | U2 Scene |
| US-3.2 | Ust Gorunum (Top-View) | U2 Scene + U5 UI (BottomBar) |
| US-3.3 | Nesne Secimi | U4 Furniture (useSelection) |
| US-4.1 | Otomatik Kayit (localStorage) | U6 Serialization + U1 Core |
| US-4.2 | JSON Export | U6 Serialization + U5 UI (BottomBar) |
| US-4.3 | JSON Import | U6 Serialization + U5 UI (BottomBar) |
| US-5.1 | Sol Panel (Katalog) | U5 UI |
| US-5.2 | Sag Panel (Ozellikler) | U5 UI |
| US-5.3 | Alt Bar (Araclar) | U5 UI |
| US-5.4 | Responsive Tasarim | U5 UI + U2 Scene |

## Unite Bazli Hikaye Sayilari

| Unite | Birincil | Ikincil | Toplam |
|-------|:--------:|:-------:|:------:|
| U1 Core | 0 | 1 | 1 |
| U2 Scene | 2 | 1 | 3 |
| U3 Room | 4 | 1 | 5 |
| U4 Furniture | 4 | 1 | 5 |
| U5 UI | 3 | 10 | 13 |
| U6 Serialization | 2 | 1 | 3 |

**Not**: U5 (UI) en fazla hikayeye dokunuyor cunku tum 3D islemler UI butonlari/paneller uzerinden tetikleniyor. Ancak UI'nin cogu is mantigi store action cagirmak, gercek is U3/U4'te.

## Dogrulama

- [x] Tum 20 hikaye en az 1 unite'ye atanmis
- [x] Hicbir hikaye atanmamis kalmamis
- [x] Her unite en az 1 hikayeye sahip
