# EviniYerlestir - Component Bagimlilik Haritasi

## Bagimlilik Matrisi

```
Component               Bagimli Oldugu
--------------------    ----------------------------------------
App                     SceneCanvas, Toolbar, PropertiesPanel, BottomBar, DesignStore
SceneCanvas             CameraControls, Ground, RoomMesh, FurnitureItem, DesignStore
CameraControls          (bagimsiz - R3F OrbitControls wrap)
RoomMesh                DesignStore, useSelection
FurnitureItem           FurnitureRegistry, DesignStore, useSelection
FurnitureModel/*        (bagimsiz - pure 3D geometry)
FurnitureRegistry       FurnitureModel/* (kayit sirasinda)
Toolbar                 DesignStore, FurnitureRegistry (katalog bilgisi)
PropertiesPanel         DesignStore, FurnitureRegistry (boyut sinir bilgisi)
BottomBar               DesignStore, SerializationService
SelectionManager        DesignStore
SerializationService    (bagimsiz - pure utility)
DesignStore             SerializationService (persist middleware)
```

## Katmanli Bagimlilik Diyagrami

```
+----------------------------------------------------------+
|                    APP (Layout)                           |
+----------------------------------------------------------+
|                          |                                |
v                          v                                v
+-----------+   +------------------+   +----------+
| Toolbar   |   | SceneCanvas      |   | Props    |
| (Sol)     |   | (3D Sahne)       |   | Panel    |
+-----------+   +------------------+   | (Sag)    |
     |          |    |    |    |       +----------+
     |          v    v    v    v            |
     |    +------+ +----+ +--------+       |
     |    |Camera| |Room| |Furnit. |       |
     |    |Ctrl  | |Mesh| |Item    |       |
     |    +------+ +----+ +--------+       |
     |                |        |           |
     |                v        v           |
     |          +------------+             |
     |          | useSelect  |             |
     |          | (hook)     |             |
     |          +------------+             |
     |                |                    |
     v                v                    v
+--------------------------------------------------+
|              DesignStore (Zustand)                |
|              Single Source of Truth               |
+--------------------------------------------------+
          |                        |
          v                        v
+------------------+    +---------------------+
| FurnitureRegistry|    | SerializationService|
| (tip bilgileri)  |    | (JSON + localStorage|
+------------------+    +---------------------+
          |
          v
+------------------+
| FurnitureModels  |
| (Sofa, Bed, ...) |
+------------------+
```

## Iletisim Paternleri

| Kaynak → Hedef | Patern | Aciklama |
|----------------|--------|----------|
| UI → Store | Zustand action | Toolbar/Panel tiklamalari store action'larini cagirir |
| Store → 3D | React re-render | State degisikligi R3F component'leri otomatik gunceller |
| 3D → Store | Zustand action | Pointer event'ler (surukle, resize) store action'larini cagirir |
| Store → Storage | Persist middleware | Her state degisikligi otomatik localStorage'a yazilir |
| Store ↔ Serial | Import/Export | JSON dosya islemleri SerializationService uzerinden |
| Registry → Models | Kayit | Her FurnitureModel bilesenini registry'ye kaydeder |
| Selection → Store | Hook → action | useSelection hook'u store.select/deselect cagirir |

## Veri Akis Yonu

```
Kullanici Etklesimi (tik, surukle, input)
         |
         v
    UI / 3D Component
         |
         v
    Zustand Store (state degisikligi)
         |
    +----+----+
    |         |
    v         v
  R3F       localStorage
 (render)   (persist)
```
