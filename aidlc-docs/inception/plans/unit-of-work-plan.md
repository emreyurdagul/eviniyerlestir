# Unit of Work Plan - EviniYerlestir

## Proje Tipi: Monolith SPA
Unite = mantiksal modul (ayri deploy yok, ayri gelistirme birimi)

## Plan Adimlari

- [x] Step 1: Unite tanimlarini olustur (unit-of-work.md)
- [x] Step 2: Unite bagimlilik matrisini olustur (unit-of-work-dependency.md)
- [x] Step 3: Hikaye-unite eslestirmesini olustur (unit-of-work-story-map.md)
- [x] Step 4: Dogrulama - tum 20 hikaye en az 1 unite'ye atanmis

---

## Onerilen Unite Ayirimi (6 unite)

| # | Unite | Kapsam | Bagimliligi |
|---|-------|--------|-------------|
| U1 | **Core (Types + Store)** | Veri modelleri, Zustand store, types | Yok (temel) |
| U2 | **3D Scene** | SceneCanvas, CameraControls, Ground, isiklar | U1 |
| U3 | **Room System** | RoomMesh, handle resize, duvar/zemin render | U1, U2 |
| U4 | **Furniture System** | FurnitureItem, 12 model, registry, handle resize | U1, U2 |
| U5 | **UI Panels** | Toolbar, PropertiesPanel, BottomBar | U1 |
| U6 | **Serialization** | JSON export/import, localStorage, schema validation | U1 |

## Soru

## Question 1
Unite gelistirme sirasi icin tercihiniz?

A) Asagidan yukari: U1 (Core) → U2 (Scene) → U3 (Room) → U4 (Furniture) → U5 (UI) → U6 (Serial) - En guvenli, her adimda calisan bir seyler var
B) Tam dikey dilim: U1+U2+U3+U5 birlikte (once sadece oda ile calisan MVP) → sonra U4+U6 ekle - Daha hizli demo edilebilir sonuc
C) Hepsini paralel yaz, sonunda birlesit - En hizli ama riskli
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---
