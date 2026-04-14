# Cycle 2 - Application Design

## Mimari Kararlar

| Karar | Secim | Gerekce |
|-------|-------|---------|
| AI SDK | `@anthropic-ai/sdk` | Resmi SDK, prompt caching, tip guvenligi |
| Onizleme | Side-by-side once/sonra | Karsilastirma kolay, kullanici fark goruyor |
| Hibrit bag | parentRoomId + offset | Mevcut state genisletilir |
| Auto-pin | 500ms debounce | Spam onlenir |

---

## Yeni / Degisecek Componentler

### Yeni Componentler (10)

```
src/
├── services/
│   ├── ai/
│   │   ├── client.ts                # @anthropic-ai/sdk wrapper
│   │   ├── prompts.ts               # System prompts (TR)
│   │   ├── schemas.ts               # JSON schema validation (Zod)
│   │   └── cache.ts                 # LRU cache for AI responses
├── components/
│   ├── AI/
│   │   ├── AIPanel.tsx              # AI butonlar + loading state
│   │   ├── AIPreviewModal.tsx       # Side-by-side onizleme
│   │   ├── AISettingsModal.tsx      # API key girisi
│   │   ├── AITextQueryModal.tsx     # "AI Plan Olustur" metin girisi
│   │   ├── PhotoToFurnitureModal.tsx # Fotograf yukleme
│   │   └── AIToast.tsx              # Auto-pin toast
│   └── Furniture/
│       └── PinIndicator.tsx         # Sabitli mobilya gorseli
└── hooks/
    ├── useAutoPin.ts                # Mobilya oda icindeyse oneri
    └── useRoomFurnitureGroup.ts     # Hibrit bag - oda tasininca mobilya da
```

### Degisecek Componentler

| Component | Degisiklik |
|-----------|-----------|
| `RoomMesh` | Tasinma sirasinda parentRoomId'li mobilyalari da hareket ettir (group transform) |
| `FurnitureItem` | parentRoomId varsa sabitleme ikonu goster, oda disina cikinca temizle |
| `PropertiesPanel` | "Odaya Sabitle" / "Kopar" butonlari + sabitli oda gostergesi |
| `BottomBar` | "🤖 AI" buton grubu (Yerlesim, Plan, Stil, Kroki) |
| `Toolbar` | "Fotograf ile Olustur" secenegi |

---

## Veri Modeli Genislemeleri

### `Room` interface (degisiklik yok)

### `FurnitureItem` interface (yeni alanlar)
```ts
interface FurnitureItem {
  // ... mevcut
  parentRoomId: string | null  // ZATEN VAR
  // YENI:
  // (yok - parentRoomId yeterli, offset hesabi run-time)
}
```

### Yeni Store State
```ts
interface DesignState {
  // ... mevcut
  // AI
  aiApiKey: string | null      // localStorage'da persist edilmez (güvenlik)
  aiPreview: AIPreview | null  // anlik onizleme verisi
  setAiApiKey: (key: string) => void
  setAiPreview: (p: AIPreview | null) => void

  // Auto-pin
  pendingAutoPin: { furnitureId: string; roomId: string } | null
  setPendingAutoPin: (p) => void

  // Group transform - yeni helper
  moveRoomWithFurniture: (roomId: string, dx: number, dz: number) => void
  rotateRoomWithFurniture: (roomId: string, dRot: number) => void
}

interface AIPreview {
  type: 'placement' | 'plan' | 'style' | 'blueprint' | 'suggestion'
  variants: Array<{
    label: string  // "Öneri 1", "Modern Stil"...
    rooms?: Room[]
    furniture?: FurnitureItem[]
    description?: string
  }>
  selectedIndex: number
}
```

---

## Servis Mimarisi

```
+----------------------------------------------------+
|                  UI Components                      |
|  AIPanel | AIPreviewModal | AISettingsModal | ...  |
+-----------------------+----------------------------+
                        |
                        v
+----------------------------------------------------+
|              services/ai/client.ts                 |
|  suggestPlacement(roomId)                          |
|  suggestFurniture(roomId)                          |
|  generatePlanFromText(query)                       |
|  analyzePhoto(imageDataUrl)                        |
|  suggestStyle(roomId)                              |
|  parseBlueprint(imageUrl)                          |
+--------+--------------+----------------------------+
         |              |
         v              v
   prompts.ts      schemas.ts
   (system          (Zod validation)
    prompts)
         |
         v
+----------------------------------------------------+
|         @anthropic-ai/sdk (Anthropic API)          |
|  - prompt caching (system prompts)                 |
|  - claude-sonnet-4-6 (default)                     |
|  - claude-opus-4-6 (vision/karmasik isler)         |
+----------------------------------------------------+
         |
         v
   cache.ts (LRU - ayni input → ayni cevap)
```

---

## AI Cagri Akisi (Ornek: suggestPlacement)

```
1. Kullanici "AI Yerlesim Onerisi" tikla
2. AISettingsModal acilir (API key yok ise)
3. Modal: "Kac oneri istersin?" (1-4)
4. AIPanel: loading spinner gosterir
5. client.suggestPlacement(roomId, count) cagrilir
   - cache.ts kontrol: ayni input + count → cached
   - cache miss → Anthropic API
   - System prompt: "Sen bir ic mimarsin, JSON yanit ver..."
   - User prompt: oda boyutu + tip + mevcut mobilyalar JSON
6. Yanit JSON schema validate (zod)
7. AIPreview state set: variants[]
8. AIPreviewModal acilir (side-by-side)
   - Sol: mevcut sahne snapshot
   - Sag: AI onerisi (active variant)
   - Tab gecisi: oneriler arasinda
   - "Uygula" → store.importLayout(variant) + cache hit log
   - "Iptal" → aiPreview=null
```

---

## Hibrit Bag Implementation

### Oda Tasininca Mobilya Da Hareket Etsin

```ts
// store/designStore.ts
moveRoomWithFurniture: (roomId, dx, dz) => set(s => {
  const room = s.rooms.find(r => r.id === roomId)
  if (!room) return s
  return {
    rooms: s.rooms.map(r => r.id === roomId
      ? { ...r, position: [r.position[0] + dx, r.position[1] + dz] }
      : r),
    furniture: s.furniture.map(f => f.parentRoomId === roomId
      ? { ...f, position: [f.position[0] + dx, f.position[1] + dz] }
      : f),
  }
})
```

### Oda Disina Cikma → Otomatik Kopar

```ts
// FurnitureItem - drag end
const onDragEnd = () => {
  const f = useDesignStore.getState().furniture.find(...)
  if (f.parentRoomId) {
    const room = useDesignStore.getState().rooms.find(r => r.id === f.parentRoomId)
    if (room && !isInsideRoom(f.position, room)) {
      useDesignStore.getState().unpinFromRoom(f.id)
      // Toast: "Mobilya sabitlemesi kaldirildi"
    }
  }
}
```

### Auto-pin Suggestion (useAutoPin hook)

```ts
// 500ms debounce sonra:
// 1. Mobilya pozisyonu hangi oda sinirinda?
// 2. Eger bir oda icinde + parentRoomId yok → pendingAutoPin set
// 3. AIToast goster: "Bu mobilyayi {X}'a sabitle?"
```

---

## Component Bagimliliklari

```
                    +--------+
                    |  App   |
                    +---+----+
                        |
       +----------------+----------------+
       v                v                v
+-------------+  +-------------+  +-------------+
| BottomBar   |  | SceneCanvas |  | AIPanel     |
| (AI menu)   |  | (RoomMesh + |  | (modals)    |
|             |  |  FurnItem)  |  |             |
+------+------+  +------+------+  +------+------+
       |                |                |
       v                v                v
+----------------------------------------------------+
|             store/designStore.ts                    |
|  rooms, furniture, aiApiKey, aiPreview,            |
|  pendingAutoPin, moveRoomWithFurniture, ...        |
+--------------------+-------------------------------+
                     |
                     v
              +----------------+
              | services/ai/   |
              |   client.ts    |
              +-------+--------+
                      |
                      v
                Anthropic API
```

---

## Code Generation Plan (Onceden Ozet)

```
Dalga 1: Foundation (paralel)
  U-A1: Store eklemeleri (aiApiKey, aiPreview, pendingAutoPin, group transforms)
  U-A2: services/ai/* (client, prompts, schemas, cache)

Dalga 2: Mobilya Sabitleme (paralel)
  U-B1: useAutoPin hook + AIToast
  U-B2: PinIndicator + FurnitureItem update
  U-B3: PropertiesPanel pin UI
  U-B4: RoomMesh group-move integration

Dalga 3: AI UI (paralel)
  U-C1: AISettingsModal (API key)
  U-C2: AIPreviewModal (side-by-side)
  U-C3: AITextQueryModal + PhotoToFurnitureModal
  U-C4: AIPanel + BottomBar entegrasyon

Dalga 4: AI Functions (sirali, prompt iterasyonu)
  U-D1: suggestPlacement + suggestFurniture
  U-D2: generatePlanFromText
  U-D3: suggestStyle
  U-D4: parseBlueprint (vision)
  U-D5: analyzePhoto (vision)

Dalga 5: Polish
  U-E: Test + bug fix + documentation
```

**Tahmini sure**: Cycle 2 buyuk - 5 dalga, 16 unite. Implementation 2-3 yogun seans.
