# EviniYerlestir - Tech Stack Decisions

## Final Tech Stack

| Katman | Teknoloji | Versiyon | Gerekce |
|--------|-----------|----------|---------|
| **Runtime** | React | 18.x | Deklaratif UI, genis ekosistem |
| **Language** | TypeScript | 5.x | Tip guvenligi, IDE destegi |
| **3D Engine** | @react-three/fiber | 8.x | Deklaratif Three.js, React state ile dogal entegrasyon |
| **3D Helpers** | @react-three/drei | 9.x | OrbitControls, useHelper, performans utilityleri |
| **3D Core** | three | 0.170+ | WebGL rendering, geometri, materyal |
| **State** | zustand | 5.x | Hafif (2KB), persist middleware, immer uyumu |
| **CSS** | Tailwind CSS | 4.x | Utility-first, responsive, kucuk bundle |
| **Build** | Vite | 6.x | Hizli HMR, tree-shaking, code splitting |
| **i18n** | react-i18next | 15.x | Endustri standardi, lazy loading, namespace |
| **Testing** | vitest | 3.x | Vite-native, hizli, TS uyumlu |
| **PBT** | fast-check | 3.x | TS uyumlu, property-based testing |
| **Lint** | ESLint | 9.x | Kod kalitesi |
| **Format** | Prettier | 3.x | Tutarli formatlama |

## 3D Optimizasyon Kararlari

| Teknik | Uygulama | Unite |
|--------|----------|-------|
| Frustum culling | R3F varsayilan (otomatik) | U2 |
| LOD | `@react-three/drei` Detailed component | U3, U4 |
| Instanced rendering | `drei` Instances/InstancedMesh | U4 |
| React.memo | Degismeyen 3D component'ler wrap | U3, U4 |
| Dynamic import | Mobilya modelleri lazy load | U4 |
| Geometry dispose | Boyut degisikliginde eski geometri temizle | U3, U4 |

## Bundle Optimizasyonu

| Strateji | Uygulama |
|----------|----------|
| Tree-shaking | Three.js'den sadece kullanilan import |
| Code splitting | Route-based (ileride) + mobilya modelleri lazy |
| Minification | Vite esbuild (default) |
| Gzip | Nginx server config |
| Asset optimize | SVG ikonlar inline, buyuk asset yok |

## Deploy Kararlari

| Karar | Deger |
|-------|-------|
| Build komutu | `npm run build` → `dist/` klasoru |
| Output | Static HTML + JS + CSS |
| Server | Nginx (kullanicinin VPS'i) |
| SSL | VPS'te mevcut sertifika |
| Cache | Vite content-hash dosya isimleri (uzun sureli cache) |
